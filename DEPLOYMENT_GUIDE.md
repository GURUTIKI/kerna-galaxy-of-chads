# Deployment Guide: Kerna Galaxy of Chads

## Architecture
We use a **Hybrid Architecture** for best performance and ease of use:
1.  **Frontend (Game)**: Hosted on **Vercel** (Fast, Auto-Deploy).
2.  **Backend (Server)**: Hosted on **Render** (Supports Socket.IO).
3.  **Database**: Hosted on **MongoDB Atlas** (Persistent Cloud Data).

---

## Step 1: Deploy Backend (Render)
The backend manages player data and real-time battles.

1.  **Push code to GitHub**.
2.  Go to [Render.com](https://render.com) and creating a **Web Service**.
3.  Connect your GitHub repo.
4.  **Settings**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
5.  **Environment Variables (Advanced)**:
    *   Add `MONGODB_URI`: Paste your MongoDB Connection String.
    *   *(Optional)* `CORS_ORIGIN`: Your eventually Vercel URL (e.g. `https://my-game.vercel.app`).
6.  **Deploy**.
7.  **Copy the Service URL** (e.g. `https://kerna-server.onrender.com`).

---

## Step 2: Deploy Frontend (Vercel)
The frontend is the website users visit.

1.  Go to [Vercel.com](https://vercel.com) and **Add New Project**.
2.  Import the same GitHub repo.
3.  **Environment Variables**:
    *   Name: `VITE_API_URL`
    *   Value: Your **Render URL** from Step 1 (e.g. `https://kerna-server.onrender.com`).
4.  **Deploy**.

---

## Step 3: Verify
1.  Open your Vercel URL.
2.  Open the Browser Console (F12).
3.  Look for: `✅ Connected to PVP Server`.
4.  If successful, you are live!
