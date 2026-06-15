// src/utils/gasUrl.ts

/**
 * Memvalidasi apakah URL yang dimasukkan merupakan URL resmi Google Apps Script Web App.
 * Digunakan bersama oleh Frontend (Vite) dan Backend Proxy (Vercel API).
 */
export const isAllowedGasUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return (
            url.protocol === 'https:' &&
            url.hostname === 'script.google.com' &&
            url.pathname.startsWith('/macros/s/') &&
            url.pathname.endsWith('/exec')
        );
    } catch {
        return false;
    }
};