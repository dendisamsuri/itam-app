import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataService } from './utils/dataService';

const PermissionsContext = createContext();

export const usePermissions = () => useContext(PermissionsContext);

export function PermissionsProvider({ children }) {
    const [permissions, setPermissions] = useState({});
    const [userRole, setUserRole] = useState(null);
    const [loaded, setLoaded] = useState(false);

    const fetchPermissions = useCallback(async () => {
        const token = localStorage.getItem('token');
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

        if (!token || isAuthPage) {
            setLoaded(true);
            return;
        }

        try {
            const user = await dataService.getUserPayload();
            if (!user) {
                setLoaded(true);
                return;
            }
            setUserRole(user.role);

            const allPermissions = await dataService.getRolePermissions();
            const permMap = {};
            if (Array.isArray(allPermissions)) {
                for (const p of allPermissions) {
                    if (p.role_name === user.role) {
                        permMap[p.menu_key] = {
                            can_view: p.can_view || false,
                            can_write: p.can_write || false
                        };
                    }
                }
            }
            setPermissions(permMap);
        } catch (err) {
            console.warn('Failed to fetch role permissions:', err);
        } finally {
            setLoaded(true);
        }
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const canView = (menuKey) => {
        if (Object.keys(permissions).length === 0) return null;
        return permissions[menuKey]?.can_view || false;
    };

    const canWrite = (menuKey) => {
        if (Object.keys(permissions).length === 0) return null;
        return permissions[menuKey]?.can_write || false;
    };

    return (
        <PermissionsContext.Provider value={{ permissions, userRole, loaded, canView, canWrite, refreshPermissions: fetchPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
}

