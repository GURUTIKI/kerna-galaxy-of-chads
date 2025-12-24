# Deployment Refactor Walkthrough

We have refactored the application to separate the Client (Frontend) and Server (Backend) logic to allow them to run on different cloud services (Netlify and Render respectively).

## Changes Implemented

### 1. Centralized Configuration
- **Created `src/config.ts`**: This file now acts as the single source of truth for the API URL.
- **Environment Variable Support**: The app now checks `import.meta.env.VITE_API_URL` first. If that exists (like on Netlify), it uses it. If not, it falls back to `http://localhost:3001` for local development.

### 2. Client-Side Updates
- **`src/systems/AuthManager.ts`**: Updated to use the dynamic `API_URL` instead of hardcoded localhost.
- **`src/systems/NetworkManager.ts`**: Updated to connect to the dynamic `API_URL`.
- **`src/main.ts`**: Updated the Leaderboard fetch to use `API_URL`.

### 3. Server-Side Updates
- **`server/server.js`**:
    - **Dynamic Port**: Now uses `process.env.PORT` (required by Render) instead of always using 3001.
    - **CORS Configuration**: Updated to allow connections from any origin (`*`) temporarily to ensure your Netlify app can talk to it without issues.

### 4. Project Configuration
- **`package.json`**: Added a `start` script (`node server/server.js`). This is the standard command Render looks for to start the server.

## Verification Steps

### 1. Check Render (Backend)
- Go to your Render Dashboard.
- Click on your `raid-galaxy-server` service.
- **Check Logs**: specificially look for "Build successful" and "Server running on...".
- **Test URL**: Visit `https://<your-service-name>.onrender.com/api/leaderboard`.
    - **Success**: You see a JSON list of players (or empty `[]`).
    - **Failure**: "Site can't be reached" or "502 Bad Gateway".

### 2. Check Netlify (Frontend)
- Go to your Netlify Dashboard.
- Ensure the `VITE_API_URL` environment variable is set to your Render URL (no trailing slash).
- **Trigger a Deploy** if you changed variables.
- Open your Netlify site.
- **Test**: Try to Register or Login. If it works, the connection is successful!
