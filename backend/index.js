const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 1. Endpoint Test Dasar
app.get('/', (req, res) => {
  res.send('ITAM API is running!');
});

// 2. Mengambil semua data User (Untuk tes)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mencari user berdasarkan nama (untuk autocomplete)
app.get('/api/users/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }
  try {
    const result = await pool.query(
      "SELECT id, name FROM users WHERE name ILIKE $1 ORDER BY name",
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mengambil daftar semua employees
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, department, email FROM employees ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { name, department, email } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const check = await pool.query('SELECT id FROM employees WHERE name = $1', [name]);
    if (check.rows.length > 0) return res.status(400).json({ error: "Employee already exists" });
    const result = await pool.query(
      'INSERT INTO employees (name, department, email) VALUES ($1, $2, $3) RETURNING *',
      [name, department || null, email || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mencari employee berdasarkan nama atau email (untuk autocomplete)
app.get('/api/employees/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }
  try {
    const result = await pool.query(
      "SELECT id, name, department, email FROM employees WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name",
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mengupdate employee
app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, department, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await pool.query(
      'UPDATE employees SET name = $1, department = $2, email = $3 WHERE id = $4 RETURNING *',
      [name, department || null, email || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Mengambil semua data Aset untuk ditampilkan di Tabel React
app.get('/api/assets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Menyimpan Aset Baru
app.post('/api/assets', async (req, res) => {
  const { serial_number, name, brand, model, specs, photo_url, purchase_date, warranty_expiry } = req.body;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let createdBy = 'system';
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      createdBy = decoded.user.name || decoded.user.username;
    } catch (e) {
      // ignore
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO assets (serial_number, name, brand, model, specs, photo_url, purchase_date, warranty_expiry, created_by, updated_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Ready') RETURNING *`,
      [serial_number, name, brand, model, specs, photo_url || null, purchase_date || null, warranty_expiry || null, createdBy, createdBy]
    );
    res.json({ message: "Aset berhasil ditambahkan!", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4a. Mengambil detail 1 Aset
app.get('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4b. Mengupdate (Edit) Aset
app.put('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const { serial_number, name, brand, model, specs, photo_url, purchase_date, warranty_expiry } = req.body;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let updatedBy = 'system';
  let userRole = 'user';

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      updatedBy = decoded.user.name || decoded.user.username;
      userRole = decoded.user.role;
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Token tidak valid' });
    }
  }

  // Hanya superadmin yang boleh edit
  if (userRole !== 'superadmin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya superadmin yang dapat mengedit aset.' });
  }

  try {
    // Check if asset exists
    const checkRes = await pool.query('SELECT id FROM assets WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE assets 
       SET serial_number = $1, name = $2, brand = $3, model = $4, specs = $5, 
           photo_url = $6, purchase_date = $7, warranty_expiry = $8, updated_by = $9 
       WHERE id = $10 RETURNING *`,
      [serial_number, name, brand, model, specs, photo_url || null, purchase_date || null, warranty_expiry || null, updatedBy, id]
    );

    res.json({ message: "Aset berhasil diupdate!", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Fitur Handover dan Return (Catat History Otomatis)
app.post('/api/assets/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action_type, recipient_name, recipient_department, recipient_email, notes } = req.body; // recipient_name is a string

  try {
    await pool.query('BEGIN');

    // 1. Get current asset state
    const assetRes = await pool.query('SELECT assigned_to, assigned_to_id FROM assets WHERE id = $1', [id]);
    if (assetRes.rows.length === 0) {
      throw new Error("Aset tidak ditemukan");
    }
    const from_user_name = assetRes.rows[0].assigned_to;
    const from_user_id = assetRes.rows[0].assigned_to_id;

    let to_user_id = null;
    let to_user_name = null;

    // 2. If it's a handover, find or create the recipient in the employees table
    if (action_type === 'HANDOVER') {
      if (!recipient_name) {
        throw new Error("Recipient name is required for handover.");
      }
      to_user_name = recipient_name;

      let employeeRes = await pool.query('SELECT id FROM employees WHERE name = $1', [to_user_name]);

      if (employeeRes.rows.length > 0) {
        to_user_id = employeeRes.rows[0].id;

        // Optionally update the existing employee's department and email if they are provided
        if (recipient_department || recipient_email) {
          await pool.query(
            'UPDATE employees SET department = COALESCE($1, department), email = COALESCE($2, email) WHERE id = $3',
            [recipient_department || null, recipient_email || null, to_user_id]
          );
        }

      } else {
        // Employee not found, create a new one
        const newEmployeeRes = await pool.query(
          'INSERT INTO employees (name, department, email) VALUES ($1, $2, $3) RETURNING id',
          [to_user_name, recipient_department || null, recipient_email || null]
        );
        to_user_id = newEmployeeRes.rows[0].id;
      }
    }

    // 3. Determine new asset status
    const status = action_type === 'HANDOVER' ? 'In Use' : 'Ready';

    // 4. Update the assets table
    await pool.query(
      'UPDATE assets SET status = $1, assigned_to = $2, assigned_to_id = $3 WHERE id = $4',
      [status, to_user_name, to_user_id, id]
    );

    // 5. Log the action in asset_history
    await pool.query(
      `INSERT INTO asset_history (asset_id, action_type, from_user, to_user, notes, from_user_id, to_user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, action_type, from_user_name, to_user_name, notes, from_user_id, to_user_id]
    );

    await pool.query('COMMIT');
    res.json({ message: `Aset berhasil di-${action_type.toLowerCase()}` });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// 6. Fitur Asset History
app.get('/api/assets/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil detail aset
    const assetRes = await pool.query('SELECT id, name, serial_number FROM assets WHERE id = $1', [id]);
    if (assetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }
    const asset = assetRes.rows[0];

    // Ambil riwayat penyerahan aset
    const historyRes = await pool.query(
      'SELECT id, action_type, from_user, to_user, notes, created_at FROM asset_history WHERE asset_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      asset: asset,
      history: historyRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, a.name as asset_name, a.serial_number 
      FROM asset_history h 
      JOIN assets a ON h.asset_id = a.id 
      ORDER BY h.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Fitur Repair History
app.get('/api/assets/:id/repairs', async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil detail aset
    const assetRes = await pool.query('SELECT id, name, serial_number FROM assets WHERE id = $1', [id]);
    if (assetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }
    const asset = assetRes.rows[0];

    // Ambil riwayat perbaikan
    const historyRes = await pool.query('SELECT * FROM repair_logs WHERE asset_id = $1 ORDER BY repair_date DESC', [id]);

    res.json({
      asset: asset,
      repairs: historyRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/repairs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.name as asset_name, a.serial_number 
      FROM repair_logs r 
      JOIN assets a ON r.asset_id = a.id 
      ORDER BY r.repair_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assets/:id/repairs', async (req, res) => {
  const { id } = req.params;
  const { fault_description, repair_details, completion_date, action, status, vendor } = req.body;

  if (!fault_description || !repair_details) {
    return res.status(400).json({ error: 'Fault and Repair details are required.' });
  }

  try {
    await pool.query('BEGIN');

    const newRepair = await pool.query(
      `INSERT INTO repair_logs (asset_id, fault_description, repair_details, completion_date, action, status, vendor) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, fault_description, repair_details, completion_date || null, action, status, vendor]
    );

    if (status === 'broken') {
      await pool.query('UPDATE assets SET status = $1 WHERE id = $2', ['Broken', id]);
    }

    await pool.query('COMMIT');
    res.status(201).json(newRepair.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Registrasi User Baru
app.post('/api/register', async (req, res) => {
  const { name, department, username, password, role } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: "Nama, username, dan password harus diisi." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    // Use the provided role, or default to 'user' if not specified
    const userRole = role === 'superadmin' ? 'superadmin' : 'user';

    const newUser = await pool.query(
      "INSERT INTO users (name, department, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, department, role",
      [name, department, username, password_hash, userRole]
    );

    res.status(201).json({
      message: "User berhasil terdaftar!",
      user: newUser.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: "Username sudah digunakan." });
    }
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Login User
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi." });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    };

    // Ganti 'your_jwt_secret' dengan secret yang lebih aman dan simpan di environment variable
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      message: "Login berhasil!",
      token: token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});