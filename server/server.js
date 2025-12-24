import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for now to prevent connection issues on deployment
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'database.json');

// Get allowed origins from env or default to extensive list
// In production, you should set CORS_ORIGIN to your Netlify URL
const allowedOrigins = process.env.CORS_ORIGIN
    ? [process.env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:4173"]
    : "*";

app.use(cors({
    origin: allowedOrigins
}));
app.use(express.json());

// Serve static files from the React/Vite app
// Check if dist exists (it will in production)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log(`Serving static files from ${distPath}`);
}

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
}

const getDb = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- Socket.io Logic ---
// We can move this to a separate file later if it grows too large, for now we keep it here for simplicity
// or import it. Let's import for cleanliness as per plan.
import { setupSocketHandlers } from './socketHandler.js';
setupSocketHandlers(io, getDb, saveDb);

// Auth Endpoints
app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    console.log(`[Auth] Registration attempt: ${username}`);

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        console.log(`[Auth] Registration failed: Username "${username}" taken (case-insensitive)`);
        return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
        username,
        password,
        data: null,
        friends: [], // List of usernames
        friendRequests: [], // List of { from: username, timestamp: number }
        pvpStats: { wins: 0, losses: 0, matches: 0 }
    };

    db.users.push(newUser);
    saveDb(db);

    console.log(`[Auth] User registered successfully: ${username}`);
    res.json({ success: true, username });
});

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    console.log(`[Auth] Login attempt: ${username}`);

    const user = db.users.find(u =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
    );

    if (!user) {
        console.log(`[Auth] Login failed for user: ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Ensure new fields exist for old users
    if (!user.friends) user.friends = [];
    if (!user.friendRequests) user.friendRequests = [];
    if (!user.pvpStats) user.pvpStats = { wins: 0, losses: 0, matches: 0 };
    saveDb(db); // Save back any schema migrations

    console.log(`[Auth] User logged in successfully: ${username}`);
    res.json({ success: true, username: user.username, data: user.data });
});

// Data persistence Endpoints
app.post('/player/save', (req, res) => {
    const { username, data } = req.body;
    const db = getDb();

    const userIndex = db.users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    db.users[userIndex].data = data; // Actually save the data!
    saveDb(db);

    res.json({ success: true });
});

app.post('/player/load', (req, res) => {
    const { username } = req.body;
    const db = getDb();

    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user.data });
});

app.post('/auth/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const db = getDb();

    const userIndex = db.users.findIndex(u => u.username === username && u.password === oldPassword);
    if (userIndex === -1) {
        return res.status(401).json({ error: 'Invalid current password' });
    }

    db.users[userIndex].password = newPassword;
    saveDb(db);

    res.json({ success: true });
});

// Leaderboard Endpoint
app.get('/api/leaderboard', (req, res) => {
    const db = getDb();
    const leaderboard = db.users
        .map(u => ({
            username: u.username,
            wins: u.pvpStats?.wins || 0,
            matches: u.pvpStats?.matches || 0,
            winRate: u.pvpStats?.matches ? ((u.pvpStats.wins / u.pvpStats.matches) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 50); // Top 50

    res.json(leaderboard);
});

// Serve index.html for any other requests (SPA support)
app.get('*', (req, res) => {
    // Only serve index.html if we are not requesting an API endpoint
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth') && !req.path.startsWith('/player') && !req.path.startsWith('/socket.io')) {
        const indexPath = path.join(__dirname, '../dist/index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('Frontend build not found. Did you run "npm run build"?');
        }
    } else {
        res.status(404).json({ error: 'Endpoint not found' });
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
