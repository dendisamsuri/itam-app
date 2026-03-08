import { supabase } from '../supabaseClient';

export const getUserPayload = async () => {
    // 1. Check local environment first
    if (import.meta.env.VITE_APP_ENV === 'local') {
        const token = localStorage.getItem('token');
        if (!token || typeof token !== 'string' || token.split('.').length < 3) return null;
        try {
            // Decoding JWT payload on the client side
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);

            // Handle different potential payload structures
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
    }

    // 2. Default to Supabase for non-local environments
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return {
            id: user.id,
            role: user.user_metadata?.role || 'user',
            name: user.user_metadata?.name || 'User'
        };
    } catch (e) {
        console.error('Failed to get Supabase user:', e);
        return null;
    }
};

export const logout = async () => {
    if (import.meta.env.VITE_APP_ENV !== 'local') {
        await supabase.auth.signOut();
    }
    localStorage.removeItem('token');
};
