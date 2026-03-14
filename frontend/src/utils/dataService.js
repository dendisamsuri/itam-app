import apiLocal from '../apiLocal';
import { supabase } from '../supabaseClient';

const isLocal = import.meta.env.VITE_APP_ENV === 'local';

const decodeLocalToken = (token) => {
    if (!token || typeof token !== 'string' || token.split('.').length < 3) return null;
    try {
        const parts = token.split('.');
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        const user = decoded.user || decoded;
        return {
            id: user.id,
            role: user.role || 'user',
            name: user.name || 'User'
        };
    } catch (e) {
        console.error('Failed to decode local token:', e);
        return null;
    }
};

export const dataService = {
    // AUTH
    login: async (username, password) => {
        if (isLocal) {
            const { data } = await apiLocal.post('/api/login', { username, password });
            if (data.token) {
                localStorage.setItem('token', data.token);
                return { session: { user: data.user }, error: null };
            }
            return { session: null, error: { message: 'Invalid credentials' } };
        } else {
            const email = username.includes('@') ? username : `${username}@itam.local`;
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (data?.session) {
                localStorage.setItem('token', data.session.access_token);
            }
            return { session: data.session, error };
        }
    },

    getSession: async () => {
        if (isLocal) {
            const token = localStorage.getItem('token');
            if (!token) return { session: null };
            try {
                // In local mode, we might need to verify the token or just return a dummy session 
                // if we don't have a verify endpoint. 
                // For now, let's assume if there's a token, we have a session.
                const userStr = localStorage.getItem('user');
                return { session: { user: userStr ? JSON.parse(userStr) : {} } };
            } catch {
                return { session: null };
            }
        } else {
            const { data } = await supabase.auth.getSession();
            return { session: data.session };
        }
    },

    logout: async () => {
        if (isLocal) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return { error: null };
        } else {
            const { error } = await supabase.auth.signOut();
            return { error };
        }
    },

    getUserPayload: async () => {
        if (isLocal) {
            const token = localStorage.getItem('token');
            return decodeLocalToken(token);
        } else {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return null;

                const { data: profile, error: profileErr } = await supabase
                    .from('users')
                    .select('role, name')
                    .eq('id', user.id)
                    .single();

                if (profileErr) {
                    console.error('Failed to fetch user profile for role (RLS issue?):', profileErr);
                }

                return {
                    id: user.id,
                    role: profile?.role || user.user_metadata?.role || 'user',
                    name: profile?.name || user.user_metadata?.name || 'User'
                };
            } catch (e) {
                console.error('Failed to get Supabase user:', e);
                return null;
            }
        }
    },

    // ASSETS
    getAssets: async (options = {}) => {
        const { searchQuery, statusFilter, userFilter, page = 0, rowsPerPage = 10 } = options;
        
        if (isLocal) {
            const { data } = await apiLocal.get('/api/assets');
            return { data: data || [], count: data?.length || 0 };
        } else {
            let query = supabase
                .from('assets')
                .select('id, serial_number, name, brand, model, photo_url, status, assigned_to, assigned_to_id, part_of_id', { count: 'exact' });

            if (searchQuery && searchQuery.length >= 3) {
                query = query.or(`name.ilike.%${searchQuery}%,serial_number.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
            }
            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }
            if (userFilter) {
                query = query.ilike('assigned_to', `%${userFilter}%`);
            }

            const from = page * rowsPerPage;
            const to = from + rowsPerPage - 1;

            const { data, error, count } = await query
                .order('id', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return { data: data || [], count: count || 0 };
        }
    },

    getAssetById: async (id) => {
        if (isLocal) {
            const { data } = await apiLocal.get(`/api/assets/${id}`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('assets')
                .select(`
                    *,
                    parent:part_of_id(id, name, serial_number, brand, assigned_to)
                `)
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        }
    },

    getAssetChildren: async (id) => {
        if (isLocal) {
            const { data } = await apiLocal.get(`/api/assets/${id}/children`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('assets')
                .select('id, name, brand, serial_number')
                .eq('part_of_id', id);
            if (error) throw error;
            return data;
        }
    },

    updateAsset: async (id, formData) => {
        if (isLocal) {
            const { error: updErr } = await apiLocal.put(`/api/assets/${id}`, formData);
            if (updErr) throw updErr;
            return { success: true };
        } else {
            // BUG FIX: Filter out non-existent columns (joined fields)
            const { 
                id: _, 
                part_of_name, part_of_brand, part_of_serial, part_of_owner,
                parent, 
                ...validData 
            } = formData;

            // BUG FIX: Convert empty strings to null for specific fields to avoid PG errors
            const payload = {};
            Object.entries(validData).forEach(([key, value]) => {
                if (value === '' && (key === 'part_of_id' || key === 'purchase_date' || key === 'warranty_expiry' || key === 'photo_url')) {
                    payload[key] = null;
                } else if (key === 'part_of_id' && value) {
                    payload[key] = parseInt(value, 10);
                } else {
                    payload[key] = value;
                }
            });

            const { error: updErr } = await supabase
                .from('assets')
                .update(payload)
                .eq('id', id);

            if (updErr) throw updErr;
            return { success: true };
        }
    },

    createAsset: async (payload) => {
        if (isLocal) {
            await apiLocal.post('/api/assets', payload);
            return { success: true };
        } else {
            // BUG FIX: Filter out non-existent columns if they happen to be in payload
            const { 
                part_of_name, part_of_brand, part_of_serial, part_of_owner, 
                ...validData 
            } = payload;

            // BUG FIX: Convert empty strings to null
            const cleanData = {};
            Object.entries(validData).forEach(([key, value]) => {
                if (value === '' && (key === 'part_of_id' || key === 'purchase_date' || key === 'warranty_expiry' || key === 'photo_url')) {
                    cleanData[key] = null;
                } else if (key === 'part_of_id' && value) {
                    cleanData[key] = parseInt(value, 10);
                } else {
                    cleanData[key] = value;
                }
            });

            const { error } = await supabase.from('assets').insert(cleanData);
            if (error) throw error;
            return { success: true };
        }
    },

    assetAction: async (id, actionData) => {
        if (isLocal) {
            await apiLocal.post(`/api/assets/${id}/action`, actionData);
            return { success: true };
        } else {
            const { action_type, recipient_name, recipient_department, recipient_email, notes, part_of_id, return_to, current_asset } = actionData;
            
            let to_user_id = null, to_user_name = null;
            if (action_type === 'HANDOVER') {
                to_user_name = recipient_name;
                let { data: empData } = await supabase.from('employees').select('id').eq('name', to_user_name).maybeSingle();
                if (empData) {
                    to_user_id = empData.id;
                    if (recipient_department || recipient_email) await supabase.from('employees').update({ department: recipient_department || null, email: recipient_email || null }).eq('id', to_user_id);
                } else {
                    const { data: newEmp, error: insErr } = await supabase.from('employees').insert({ name: to_user_name, department: recipient_department || null, email: recipient_email || null }).select().single();
                    if (insErr) throw insErr;
                    to_user_id = newEmp.id;
                }
            }

            if (action_type === 'RETURN') {
                if (!return_to) throw new Error("Return to (IT/GA) is required.");
                const settingKey = return_to.toLowerCase() === 'it' ? 'it_user_id' : 'ga_user_id';
                const { data: setRes, error: setErr } = await supabase.from('settings').select('value').eq('key', settingKey).maybeSingle();
                if (setErr) throw setErr;
                if (!setRes || !setRes.value) throw new Error(`User for ${return_to} is not configured.`);

                to_user_id = parseInt(setRes.value, 10);
                const { data: empData, error: empErr } = await supabase.from('employees').select('name').eq('id', to_user_id).single();
                if (empErr) throw empErr;
                to_user_name = empData.name;
            }

            const status = action_type === 'HANDOVER' ? 'In Use' : 'Ready';
            await supabase.from('assets').update({ 
                status, 
                assigned_to: to_user_name, 
                assigned_to_id: to_user_id, 
                part_of_id: action_type === 'HANDOVER' ? (part_of_id || null) : current_asset.part_of_id 
            }).eq('id', id);
            
            await supabase.from('asset_history').insert({ 
                asset_id: id, 
                action_type: action_type, 
                from_user: current_asset.assigned_to, 
                to_user: to_user_name, 
                notes, 
                from_user_id: current_asset.assigned_to_id, 
                to_user_id: to_user_id 
            });

            // BUG FIX: Cascading Handover/Return for child assets
            const { data: children, error: childErr } = await supabase
                .from('assets')
                .select('id, assigned_to, assigned_to_id')
                .eq('part_of_id', id);
            
            if (childErr) {
                console.error(`Failed to fetch children for asset ${id} for cascading ${action_type}:`, childErr);
            } else if (children && children.length > 0) {
                for (const child of children) {
                    await supabase.from('assets').update({ 
                        status, 
                        assigned_to: to_user_name, 
                        assigned_to_id: to_user_id 
                    }).eq('id', child.id);

                    await supabase.from('asset_history').insert({ 
                        asset_id: child.id, 
                        action_type: action_type, 
                        from_user: child.assigned_to, 
                        to_user: to_user_name, 
                        notes: `Auto-cascaded from parent asset #${id}: ${notes || ''}`.trim(), 
                        from_user_id: child.assigned_to_id, 
                        to_user_id: to_user_id 
                    });
                }
            }

            return { success: true };
        }
    },

    // EMPLOYEES
    getEmployees: async (options = {}) => {
        const { searchQuery, page = 0, rowsPerPage = 10 } = options;
        if (isLocal) {
            const { data } = await apiLocal.get('/api/employees');
            return { data: data || [], count: data?.length || 0 };
        } else {
            let query = supabase
                .from('employees')
                .select('id, name, department, email', { count: 'exact' });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            }

            const from = page * rowsPerPage;
            const to = from + rowsPerPage - 1;

            const { data, error, count } = await query
                .order('name', { ascending: true })
                .range(from, to);

            if (error) throw error;
            return { data: data || [], count: count || 0 };
        }
    },

    searchEmployees: async (q) => {
        if (isLocal) {
            const { data } = await apiLocal.get(`/api/employees/search?q=${encodeURIComponent(q)}`);
            return data;
        } else {
            const { data, error } = await supabase.from('employees').select('id, name, department, email').or(`name.ilike.%${q}%,email.ilike.%${q}%`).order('name');
            if (error) throw error;
            return data;
        }
    },

    createEmployee: async (employeeData) => {
        if (isLocal) {
            await apiLocal.post('/api/employees', employeeData);
            return { success: true };
        } else {
            const { error } = await supabase.from('employees').insert(employeeData);
            if (error) throw error;
            return { success: true };
        }
    },

    updateEmployee: async (id, employeeData) => {
        if (isLocal) {
            await apiLocal.put(`/api/employees/${id}`, employeeData);
            return { success: true };
        } else {
            const { error } = await supabase
                .from('employees')
                .update(employeeData)
                .eq('id', id);
            if (error) throw error;
            return { success: true };
        }
    },

    // USERS
    getUsers: async () => {
        if (isLocal) {
            const { data } = await apiLocal.get('/api/users');
            return data;
        } else {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, department, role')
                .is('deleted_at', null)
                .order('name');
            if (error) throw error;
            return data;
        }
    },

    updateUser: async (id, userData) => {
        if (isLocal) {
            await apiLocal.put(`/api/users/${id}`, userData);
            return { success: true };
        } else {
            // BUG FIX: Remove ID from payload and add error handling
            const { id: _, username, ...validData } = userData;
            
            // Log for debugging
            console.log(`Updating user ${id} with:`, validData);

            const { data, error } = await supabase
                .from('users')
                .update(validData)
                .eq('id', id)
                .select();
            
            if (error) {
                console.error(`Supabase User Update Error (${id}):`, error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn(`No user found with ID ${id} or no changes were made.`);
            } else {
                console.log(`Successfully updated user ${id}:`, data[0]);
            }
            
            return { success: true, data };
        }
    },

    deleteUser: async (id) => {
        if (isLocal) {
            await apiLocal.delete(`/api/users/${id}`);
            return { success: true };
        } else {
            const { error } = await supabase
                .from('users')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            return { success: true };
        }
    },

    resetPassword: async (userId, newPassword) => {
        if (isLocal) {
            await apiLocal.put(`/api/users/${userId}/reset-password`, { new_password: newPassword });
            return { success: true };
        } else {
            throw new Error('Password reset for users is not available directly via frontend in production.');
        }
    },

    registerUser: async (userData) => {
        if (isLocal) {
            await apiLocal.post('/api/register', userData);
            return { success: true };
        } else {
            const { name, department, role, email, username, password } = userData;
            const userEmail = email || (username.includes('@') ? username : `${username}@itam.local`);
            const { error: authError } = await supabase.auth.signUp({
                email: userEmail,
                password: password,
                options: {
                    data: {
                        name: name,
                        department: department,
                        role: role
                    }
                }
            });
            if (authError) throw authError;
            return { success: true };
        }
    },

    // HISTORY & REPAIRS
    getAssetHistory: async (assetId) => {
        if (isLocal) {
            const { data } = await apiLocal.get(`/api/assets/${assetId}/history`);
            return { history: data.history || [] };
        } else {
            const { data, error } = await supabase
                .from('asset_history')
                .select('*')
                .eq('asset_id', assetId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { history: data || [] };
        }
    },

    getGlobalHistory: async () => {
        if (isLocal) {
            const { data } = await apiLocal.get('/api/history');
            return data;
        } else {
            const { data, error } = await supabase
                .from('asset_history_view')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    getAssetRepairs: async (assetId, options = {}) => {
        const { page = 0, rowsPerPage = 10 } = options;
        if (isLocal) {
            const { data } = await apiLocal.get(`/api/assets/${assetId}/repairs`);
            // data is { asset, repairs }
            return { 
                repairs: data.repairs || [], 
                count: data.repairs?.length || 0 
            };
        } else {
            const from = page * rowsPerPage;
            const to = from + rowsPerPage - 1;

            const { data, error, count } = await supabase
                .from('repair_logs')
                .select('*', { count: 'exact' })
                .eq('asset_id', assetId)
                .order('repair_date', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return { repairs: data || [], count: count || 0 };
        }
    },

    getGlobalRepairs: async () => {
        if (isLocal) {
            const { data } = await apiLocal.get('/api/repairs');
            return data;
        } else {
            const { data, error } = await supabase
                .from('repair_logs_view')
                .select('*')
                .order('repair_date', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    createRepair: async (assetId, repairData) => {
        if (isLocal) {
            await apiLocal.post(`/api/assets/${assetId}/repairs`, repairData);
            return { success: true };
        } else {
            const { error } = await supabase.from('repair_logs').insert({
                ...repairData,
                asset_id: assetId,
                completion_date: repairData.completion_date || null
            });
            if (error) throw error;

            if (repairData.status === 'broken') {
                await supabase.from('assets').update({ status: 'Broken' }).eq('id', assetId);
            }
            return { success: true };
        }
    },

    // SETTINGS & PERMISSIONS
    getSettings: async () => {
        if (isLocal) {
            const { data } = await apiLocal.get('/api/settings');
            // Transform { key: value } to [{ key, value }] to match Supabase
            return Object.entries(data || {}).map(([key, value]) => ({ key, value }));
        } else {
            const { data, error } = await supabase.from('settings').select('key, value');
            if (error) throw error;
            return data;
        }
    },

    updateSettings: async (settings) => {
        if (isLocal) {
            await apiLocal.post('/api/settings', { settings });
            return { success: true };
        } else {
            const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }));
            const { error } = await supabase.from('settings').upsert(settingsArray, { onConflict: 'key' });
            if (error) throw error;
            return { success: true };
        }
    },

    getRolePermissions: async () => {
        if (isLocal) {
            const { data } = await apiLocal.get('/api/role-permissions');
            return data;
        } else {
            const { data, error } = await supabase.from('role_permissions').select('*').order('role_name');
            if (error) throw error;
            return data;
        }
    },

    updateRolePermissions: async (permissions) => {
        if (isLocal) {
            await apiLocal.post('/api/role-permissions', { permissions });
            return { success: true };
        } else {
            const { error } = await supabase.from('role_permissions').upsert(permissions, { onConflict: 'role_name,menu_key' });
            if (error) throw error;
            return { success: true };
        }
    }
};
