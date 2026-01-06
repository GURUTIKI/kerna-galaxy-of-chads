/**
 * Global Configuration
 * 
 * Hybrid Setup (Vercel + Render):
 * Frontend is on Vercel, Backend is on Render.
 * We MUST set VITE_API_URL in Vercel to point to the Render backend URL.
 * 
 * Local Development:
 * If VITE_API_URL is set (in .env), use it.
 * Otherwise, if we are on localhost:5173 (Vite), assume server is on localhost:3001.
 */

const isLocalVite = typeof window !== 'undefined' && window.location.port === '5173';

export const API_URL = import.meta.env.VITE_API_URL || (isLocalVite ? "http://localhost:3001" : "");
