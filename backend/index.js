const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://itam-app.pages.dev'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware untuk mengecek permission berdasarkan role dan menu_key
const checkPermission = (menuKey, actionType = 'view') => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      const userRole = decoded.user.role;

      // Superadmin selalu memiliki full access
      if (userRole === 'superadmin') {
        req.user = decoded.user;
        return next();
      }

      // Query database untuk mengecek permission
      const permRes = await pool.query(
        'SELECT can_view, can_write FROM role_permissions WHERE role_name = $1 AND menu_key = $2',
        [userRole, menuKey]
      );

      if (permRes.rows.length === 0) {
        return res.status(403).json({ error: `Akses ditolak. Role ${userRole} tidak memiliki permission untuk menu ${menuKey}.` });
      }

      const permissions = permRes.rows[0];

      if (actionType === 'write' && !permissions.can_write) {
        return res.status(403).json({ error: `Akses ditolak. Anda tidak memiliki izin untuk memodifikasi (write) pada menu ${menuKey}.` });
      }

      if (actionType === 'view' && !permissions.can_view && !permissions.can_write) {
        return res.status(403).json({ error: `Akses ditolak. Anda tidak memiliki izin untuk melihat (view) menu ${menuKey}.` });
      }

      // Simpan data user ke request untuk digunakan di endpoint selanjutnya
      req.user = decoded.user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Token tidak valid' });
    }
  };
};

// 1. Endpoint Test Dasar
app.get('/', (req, res) => {
  res.send('ITAM API is running!');
});

// 2. Mengambil semua data User (exclude soft-deleted)
app.get('/api/users', checkPermission('user_list', 'view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, username, email, department, role FROM users WHERE deleted_at IS NULL ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mencari user berdasarkan nama (untuk autocomplete)
app.get('/api/users/search', checkPermission('user_list', 'view'), async (req, res) => {
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
app.get('/api/employees', checkPermission('employee_list', 'view'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, department, email FROM employees ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', checkPermission('employee_list', 'write'), async (req, res) => {
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
app.get('/api/employees/search', checkPermission('employee_list', 'view'), async (req, res) => {
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
app.put('/api/employees/:id', checkPermission('employee_list', 'write'), async (req, res) => {
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
app.get('/api/assets', checkPermission('asset_list', 'view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Menyimpan Aset Baru
app.post('/api/assets', checkPermission('add_asset', 'write'), async (req, res) => {
  const { serial_number, name, brand, model, specs, photo_url, purchase_date, warranty_expiry, part_of_id } = req.body;
  const createdBy = req.user?.name || req.user?.username || 'system';

  try {
    const result = await pool.query(
      `INSERT INTO assets (serial_number, name, brand, model, specs, photo_url, purchase_date, warranty_expiry, created_by, updated_by, status, part_of_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Ready', $11) RETURNING *`,
      [serial_number, name, brand, model, specs, photo_url || null, purchase_date || null, warranty_expiry || null, createdBy, createdBy, part_of_id || null]
    );
    res.json({ message: "Aset berhasil ditambahkan!", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4a. Mengambil detail 1 Aset
app.get('/api/assets/:id', checkPermission('asset_list', 'view'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.*, p.name as part_of_name, p.brand as part_of_brand, p.serial_number as part_of_serial, p.assigned_to as part_of_owner 
      FROM assets a 
      LEFT JOIN assets p ON a.part_of_id = p.id 
      WHERE a.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4b. Mengupdate (Edit) Aset
app.put('/api/assets/:id', checkPermission('asset_list', 'write'), async (req, res) => {
  const { id } = req.params;
  const { serial_number, name, brand, model, specs, photo_url, purchase_date, warranty_expiry, part_of_id } = req.body;
  const updatedBy = req.user?.name || req.user?.username || 'system';

  try {
    // Check if asset exists
    const checkRes = await pool.query('SELECT id FROM assets WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Aset tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE assets 
       SET serial_number = $1, name = $2, brand = $3, model = $4, specs = $5, 
           photo_url = $6, purchase_date = $7, warranty_expiry = $8, updated_by = $9,
           part_of_id = $10 
       WHERE id = $11 RETURNING *`,
      [serial_number, name, brand, model, specs, photo_url || null, purchase_date || null, warranty_expiry || null, updatedBy, part_of_id || null, id]
    );

    res.json({ message: "Aset berhasil diupdate!", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5a. Mengambil daftar sub-aset (children)
app.get('/api/assets/:id/children', checkPermission('asset_list', 'view'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM assets WHERE part_of_id = $1 ORDER BY id DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Fitur Handover dan Return (Catat History Otomatis)
// 5. Fitur Handover dan Return (Catat History Otomatis)
app.post('/api/assets/:id/action', checkPermission('asset_list', 'write'), async (req, res) => {
  const { id } = req.params;
  const { action_type, recipient_name, recipient_department, recipient_email, notes, part_of_id, return_to } = req.body; // recipient_name is a string

  try {
    await pool.query('BEGIN');

    // 1. Get current asset state
    const assetRes = await pool.query('SELECT assigned_to, assigned_to_id, part_of_id FROM assets WHERE id = $1', [id]);
    if (assetRes.rows.length === 0) {
      throw new Error("Aset tidak ditemukan");
    }
    const from_user_name = assetRes.rows[0].assigned_to;
    const from_user_id = assetRes.rows[0].assigned_to_id;

    // Coerce part_of_id to integer or null
    let part_of_id_int = null;
    if (part_of_id !== undefined && part_of_id !== null && part_of_id !== '') {
      part_of_id_int = parseInt(part_of_id, 10);
    }

    // Use part_of_id from request if provided, otherwise use current
    const final_part_of_id = (action_type === 'HANDOVER' && part_of_id !== undefined) ? part_of_id_int : assetRes.rows[0].part_of_id;

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

    // 2a. If it's a return, resolve the recipient from settings
    if (action_type === 'RETURN') {
      if (!return_to) {
        throw new Error("Return to (IT/GA) is required for return action.");
      }

      const settingKey = return_to.toLowerCase() === 'it' ? 'it_user_id' : 'ga_user_id';
      const settingRes = await pool.query('SELECT value FROM settings WHERE key = $1', [settingKey]);

      if (settingRes.rows.length === 0 || !settingRes.rows[0].value) {
        throw new Error(`User for ${return_to} is not configured in settings.`);
      }

      to_user_id = parseInt(settingRes.rows[0].value, 10);
      const employeeRes = await pool.query('SELECT name FROM employees WHERE id = $1', [to_user_id]);

      if (employeeRes.rows.length === 0) {
        throw new Error(`Configured ${return_to} user (ID: ${to_user_id}) not found in employees table.`);
      }

      to_user_name = employeeRes.rows[0].name;
    }

    // 3. Determine new asset status
    const status = action_type === 'HANDOVER' ? 'In Use' : 'Ready';

    // 4. Special validation for handover: check if asset is part of another asset
    if (action_type === 'HANDOVER' && final_part_of_id) {
      const parentRes = await pool.query(`
        SELECT id, name, serial_number, assigned_to, assigned_to_id, status
        FROM assets
        WHERE id = $1
      `, [final_part_of_id]);

      if (parentRes.rows.length > 0) {
        const parent = parentRes.rows[0];
        // Validation: User and asset part of its must match
        // Only allow handover if recipient matches parent owner
        // If parent is Ready (not assigned), block handover until parent is assigned
        if (parent.status === 'Ready') {
          throw new Error(`Aset ini adalah bagian dari ${parent.name} (${parent.serial_number}) yang statusnya masih 'Ready'. Silakan serahkan aset induknya terlebih dahulu.`);
        }

        if (parent.assigned_to !== to_user_name || (parent.assigned_to_id && parent.assigned_to_id !== to_user_id)) {
          throw new Error(`Internal Asset Policy: User dan aset induknya harus sesuai. Aset ini adalah bagian dari ${parent.name} (${parent.serial_number}) yang saat ini dipegang oleh ${parent.assigned_to}.`);
        }
      }
    }

    // 5. Update the assets table in one go
    await pool.query(
      'UPDATE assets SET status = $1, assigned_to = $2, assigned_to_id = $3, part_of_id = $4 WHERE id = $5',
      [status, to_user_name, to_user_id, final_part_of_id, id]
    );

    // 5b. Log the action in asset_history
    await pool.query(
      `INSERT INTO asset_history (asset_id, action_type, from_user, to_user, notes, from_user_id, to_user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, action_type, from_user_name, to_user_name, notes, from_user_id, to_user_id]
    );

    // 6. Cascading: Find and update all child assets (part_of_id = this asset's id)
    const childrenRes = await pool.query('SELECT id, assigned_to, assigned_to_id FROM assets WHERE part_of_id = $1', [id]);
    for (const child of childrenRes.rows) {
      // Update child asset status and assignment to match parent
      await pool.query(
        'UPDATE assets SET status = $1, assigned_to = $2, assigned_to_id = $3 WHERE id = $4',
        [status, to_user_name, to_user_id, child.id]
      );
      // Log history for each child asset
      await pool.query(
        `INSERT INTO asset_history (asset_id, action_type, from_user, to_user, notes, from_user_id, to_user_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [child.id, action_type, child.assigned_to, to_user_name, `Auto-cascaded from parent asset #${id}: ${notes || ''}`.trim(), child.assigned_to_id, to_user_id]
      );
    }

    const childCount = childrenRes.rows.length;
    await pool.query('COMMIT');
    res.json({ message: `Aset berhasil di-${action_type.toLowerCase()}${childCount > 0 ? ` (termasuk ${childCount} sub-aset)` : ''}` });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// 6. Fitur Asset History
app.get('/api/assets/:id/history', checkPermission('asset_history', 'view'), async (req, res) => {
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

app.get('/api/history', checkPermission('asset_history', 'view'), async (req, res) => {
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
app.get('/api/assets/:id/repairs', checkPermission('repair_history', 'view'), async (req, res) => {
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

app.get('/api/repairs', checkPermission('repair_history', 'view'), async (req, res) => {
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

app.post('/api/assets/:id/repairs', checkPermission('repair_history', 'write'), async (req, res) => {
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
app.post('/api/register', checkPermission('add_user', 'write'), async (req, res) => {
  const { name, department, username, email, password, role } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: "Nama, username, dan password harus diisi." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    // Use the provided role, or default to 'superadmin' if not specified or invalid
    const userRole = (role === 'admin' || role === 'user' || role === 'superadmin') ? role : 'superadmin';

    const newUser = await pool.query(
      "INSERT INTO users (name, department, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, email, department, role",
      [name, department, username, email || null, password_hash, userRole]
    );

    res.status(201).json({
      message: "User berhasil terdaftar!",
      user: newUser.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: "Username atau email sudah digunakan." });
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
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
    
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

// Alias endpoint login tanpa /api prefix untuk kompatibilitas
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi." });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
    
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

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      message: "Login berhasil!",
      token: token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Reset Password (Hanya Superadmin - tapi sekarang dikontrol via DB)
app.put('/api/users/:id/reset-password', checkPermission('user_list', 'write'), async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password) {
    return res.status(400).json({ error: "Password baru harus diisi." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username",
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }

    res.json({ message: "Password berhasil direset!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Settings
app.get('/api/settings', checkPermission('settings', 'view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', checkPermission('settings', 'write'), async (req, res) => {
  const { settings } = req.body; // Expecting { key: value, ... }
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: "Invalid settings data" });
  }

  try {
    await pool.query('BEGIN');
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at',
        [key, value]
      );
    }
    await pool.query('COMMIT');
    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Edit User (Hanya Superadmin - tapi sekarang dikontrol via role DB)
app.put('/api/users/:id', checkPermission('user_list', 'write'), async (req, res) => {
  const { id } = req.params;
  const { name, department, email, role } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nama harus diisi.' });
  }

  try {
    const validRole = role === 'superadmin' ? 'superadmin' : (role === 'admin' ? 'admin' : 'user');
    const result = await pool.query(
      'UPDATE users SET name = $1, department = $2, email = $3, role = $4 WHERE id = $5 AND deleted_at IS NULL RETURNING id, name, username, email, department, role',
      [name, department || null, email || null, validRole, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    res.json({ message: 'User berhasil diupdate!', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username atau email sudah digunakan.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Soft Delete User (Hanya Superadmin - tapi sekarang dikontrol via DB)
app.delete('/api/users/:id', checkPermission('user_list', 'write'), async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  // Prevent self-deletion
  if (String(currentUserId) === String(id)) {
    return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id, username',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Role Permissions
app.get('/api/role-permissions', checkPermission('settings', 'view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM role_permissions ORDER BY role_name, menu_key');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/role-permissions', checkPermission('settings', 'write'), async (req, res) => {
  const { permissions } = req.body; // Array of { role_name, menu_key, can_view, can_write }

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Invalid permissions data. Expected an array.' });
  }

  try {
    await pool.query('BEGIN');
    for (const perm of permissions) {
      await pool.query(
        `INSERT INTO role_permissions (role_name, menu_key, can_view, can_write) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (role_name, menu_key) 
         DO UPDATE SET can_view = EXCLUDED.can_view, can_write = EXCLUDED.can_write`,
        [perm.role_name, perm.menu_key, perm.can_view || false, perm.can_write || false]
      );
    }
    await pool.query('COMMIT');
    res.json({ message: 'Permissions berhasil disimpan!' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});