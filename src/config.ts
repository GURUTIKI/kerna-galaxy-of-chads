/**
 * Global Configuration
 * 
 * In the new "All-in-One" setup, the frontend is served *by* the backend.
 * This means the API is on the same URL as the website.
 * We can use an empty string "" to mean "current origin".
 * 
 * Local Development:
 * If VITE_API_URL is set (in .env), use it.
 * Otherwise, if we are on localhost:5173 (Vite), assume server is on localhost:3001.
 */

const isLocalVite = typeof window !== 'undefined' && window.location.port === '5173';

export const API_URL = import.meta.env.VITE_API_URL || (isLocalVite ? "http://localhost:3001" : "");
