import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// MongoDB Connection
// Fallback to the user-provided string if env var key is missing (Eases deployment)
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("FATAL: MONGODB_URI environment variable is missing.");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));


// Get allowed origins from env or default to extensive list
const allowedOrigins = process.env.CORS_ORIGIN
    ? [process.env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:4173"]
    : "*";

app.use(cors({
    origin: allowedOrigins
}));
app.use(express.json());


// --- Socket.io Logic ---
import { setupSocketHandlers } from './socketHandler.js';
// We don't pass getDb/saveDb anymore as socketHandler will use Mongoose directly
setupSocketHandlers(io);

// Auth Endpoints
app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;

    console.log(`[Auth] Registration attempt: ${username}`);

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const existingUser = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = new User({
            username,
            password, // Note: In a real app, hash this with bcrypt!
            data: null,
            friends: [],
            friendRequests: [],
            pvpStats: { wins: 0, losses: 0, matches: 0 }
        });

        await newUser.save();

        console.log(`[Auth] User registered successfully: ${username}`);
        res.json({ success: true, username });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Case-insensitive lookup
        const user = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });

        if (!user || user.password !== password) {
            console.log(`[Auth] Login failed for user: ${username}`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        console.log(`[Auth] User logged in successfully: ${user.username}`);
        res.json({ success: true, username: user.username, data: user.data });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Data persistence Endpoints
app.post('/player/save', async (req, res) => {
    const { username, data } = req.body;

    try {
        // We use username as key
        await User.findOneAndUpdate({ username }, { data });
        res.json({ success: true });
    } catch (err) {
        console.error('Save Error:', err);
        res.status(500).json({ error: 'Save failed' });
    }
});

app.post('/player/load', async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findOne({ username }).collation({ locale: 'en', strength: 2 });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, data: user.data });
    } catch (err) {
        console.error('Load Error:', err);
        res.status(500).json({ error: 'Load failed' });
    }
});

app.post('/auth/change-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || user.password !== oldPassword) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true });
    } catch (err) {
        console.error('Password Change Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DEV TOOL: Give All Characters
app.post('/api/admin/give-all-chars', async (req, res) => {
    const { username } = req.body;

    // Hardcoded list of character IDs based on abilities.ts exports or knowledge
    // Since we don't have a central registry importable easily here without 'type: module' complexity with ts files,
    // I stands to reason I should just list them or use a wildcard if the data structure supports it.
    // The user data stores 'ownedCharacters' as an array of strings (IDs).
    // I will list the known IDs from analysis of abilities.ts earlier:
    const allCharIds = [
        'bru', 'jatt', 'pure', 'zdb', 'kappy',
        'fazoid', 'mercy', 'papa', 'guru', 'jb',
        'kappa', 'suze', 'toxo', 'cuber', 'j-dog',
        'thor', 'elk', 'zez', 'dafran', 'nexus'
    ];

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Merge and deduplicate
        const currentOwned = user.data?.ownedCharacters || [];
        const newOwned = [...new Set([...currentOwned, ...allCharIds])];

        if (!user.data) user.data = {};
        user.data.ownedCharacters = newOwned;

        await user.save();
        console.log(`[Admin] Gave all characters to ${username}`);
        res.json({ success: true, count: newOwned.length });
    } catch (err) {
        console.error('Admin Tool Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Leaderboard Endpoint
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Fetch top 50 by wins
        const topUsers = await User.find({})
            .sort({ 'pvpStats.wins': -1 })
            .limit(50)
            .select('username pvpStats');

        const leaderboard = topUsers.map(u => ({
            username: u.username,
            wins: u.pvpStats?.wins || 0,
            matches: u.pvpStats?.matches || 0,
            winRate: u.pvpStats?.matches ? ((u.pvpStats.wins / u.pvpStats.matches) * 100).toFixed(1) : 0,
            avgLevel: u.pvpStats?.avgLevel || 0
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error('Leaderboard Error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Serve index.html for any other requests (SPA support)
// Note: Express 5 requires regex /.*/ instead of '*' for catch-all
app.get(/.*/, (req, res) => {
    // Only serve index.html if we are not requesting an API endpoint
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth') && !req.path.startsWith('/player') && !req.path.startsWith('/socket.io')) {
        const indexPath = path.join(__dirname, '../dist/index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.send('✅ Kerna API Server is Online. (Frontend is hosted on Vercel)');
        }
    } else {
        res.status(404).json({ error: 'Endpoint not found' });
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
