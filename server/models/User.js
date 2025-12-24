import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In production, hash this!
    data: { type: mongoose.Schema.Types.Mixed, default: null }, // Game data (stats, inventory, etc)
    friends: [{ type: String }], // Array of usernames
    friendRequests: [{
        from: String,
        timestamp: Number
    }],
    pvpStats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        matches: { type: Number, default: 0 },
        avgLevel: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Case-insensitive index for username lookups
userSchema.index({ username: 1 }, { collation: { locale: 'en', strength: 2 } });

export const User = mongoose.model('User', userSchema);
