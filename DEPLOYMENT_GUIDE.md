# Deployment Guide for 'Raid Galaxy of Legends'

Since your game has two parts (Frontend and Backend), you need to host them separately to keep the game running 24/7 without your laptop.

## Part 1: Deploying the Server (Backend)

The server needs to run continuously. We will use **Render** (free tier available).

1.  **Push your code to GitHub** (if you haven't already).
2.  Go to [Render.com](https://render.com) and sign up/login.
3.  Click **"New +"** -> **"Web Service"**.
4.  Connect your GitHub repository.
5.  **Configure the service**:
    *   **Name**: `raid-galaxy-server` (or similar)
    *   **Region**: Choose one close to you (e.g., Frankfurt or Oregon).
    *   **Branch**: `main` (or your working branch).
    *   **Root Directory**: Leave blank (it's the root).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start` (This runs `node server/server.js`)
    *   **Instance Type**: Free.
6.  Click **"Create Web Service"**.
7.  Wait for it to deploy. Once live, copy the URL (e.g., `https://raid-galaxy-server.onrender.com`).
    *   *Note: The free tier spins down after inactivity, so the first request might take a minute to wake it up.*

## Part 2: Deploying the Game (Frontend)

You are already using Netlify. We just need to tell Netlify where your new server is.

1.  Go to your **Netlify Dashboard**.
2.  Select your site.
3.  Go to **Site configuration** -> **Environment variables**.
4.  Click **"Add a variable"**.
    *   **Key**: `VITE_API_URL`
    *   **Value**: The URL you copied from Render (e.g., `https://raid-galaxy-server.onrender.com`).
        *   *Important: Do NOT add a trailing slash `/` at the end.*
5.  **Trigger a new deploy**:
    *   Go to **Deploys** -> **Trigger deploy** -> **Deploy site**.
    *   Or just push a small change to GitHub to auto-trigger it.
6.  Once built, your Netlify site will now connect to your Render server!

## Important Notes

*   **Database Reset**: Since you are using a simple file database (`database.json`) and the free tier of Render recycles the server occasionally, **player accounts and data will be reset periodically**. To fix this in the future, you would need to connect a real database like MongoDB.
*   **Waking Up**: If the game says "Server unreachable" on existing accounts, try refreshing the page after 1 minute. The free server sleeps when no one uses it.
