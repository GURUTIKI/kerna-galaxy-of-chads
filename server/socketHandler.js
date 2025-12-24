import { User } from './models/User.js';

export function setupSocketHandlers(io) {
    const connectedUsers = new Map(); // socketId -> username
    const onlineUsers = new Map();    // username -> socketId
    const mmQueue = [];               // { socketId, username, teamData }

    // Room State: { [roomId]: { p1: {username, socketId, team?}, p2: {username, socketId, team?} } }
    const activeBattles = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('register_user', (username) => {
            connectedUsers.set(socket.id, username);
            onlineUsers.set(username, socket.id);
            console.log(`User registered on socket: ${username}`);
        });

        socket.on('disconnect', () => {
            const username = connectedUsers.get(socket.id);
            if (username) {
                connectedUsers.delete(socket.id);
                onlineUsers.delete(username);
                console.log(`User disconnected: ${username}`);

                // Remove from matchmaking queue if present
                const qIdx = mmQueue.findIndex(p => p.socketId === socket.id);
                if (qIdx > -1) {
                    mmQueue.splice(qIdx, 1);
                }
            }
        });

        // --- Friend System ---

        socket.on('search_users', async (query) => {
            if (!query) return;
            try {
                const matches = await User.find({
                    username: { $regex: query, $options: 'i' }
                })
                    .limit(10)
                    .select('username');

                socket.emit('search_results', matches.map(u => ({ username: u.username })));
            } catch (err) {
                console.error("Search Error", err);
            }
        });

        socket.on('send_friend_request', async (targetUsername) => {
            const sender = connectedUsers.get(socket.id);
            if (!sender) return;

            try {
                const target = await User.findOne({ username: targetUsername });
                const senderUser = await User.findOne({ username: sender });

                if (!target) {
                    socket.emit('friend_request_error', 'User not found');
                    return;
                }

                if (target.friendRequests.some(r => r.from === sender)) {
                    socket.emit('friend_request_error', 'Request already sent');
                    return;
                }

                if (target.friends.includes(sender)) {
                    socket.emit('friend_request_error', 'Already friends');
                    return;
                }

                // Add request
                target.friendRequests.push({ from: sender, timestamp: Date.now() });
                await target.save();

                // Notify target if online
                const targetSocketId = onlineUsers.get(targetUsername);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('new_friend_request', { from: sender });
                }

                socket.emit('friend_request_sent', targetUsername);
            } catch (err) {
                console.error("Friend Request Error", err);
                socket.emit('friend_request_error', 'Server Error');
            }
        });

        socket.on('accept_friend_request', async (requesterUsername) => {
            const receiver = connectedUsers.get(socket.id);
            if (!receiver) return;

            try {
                const receiverUser = await User.findOne({ username: receiver });
                const requesterUser = await User.findOne({ username: requesterUsername });

                if (!receiverUser || !requesterUser) return;

                // Add each other if not already
                if (!receiverUser.friends.includes(requesterUsername)) {
                    receiverUser.friends.push(requesterUsername);
                }
                if (!requesterUser.friends.includes(receiver)) {
                    requesterUser.friends.push(receiver);
                }

                // Remove request
                receiverUser.friendRequests = receiverUser.friendRequests.filter(r => r.from !== requesterUsername);

                await receiverUser.save();
                await requesterUser.save();

                // Notify both
                socket.emit('friend_added', requesterUsername);
                const requesterSocketId = onlineUsers.get(requesterUsername);
                if (requesterSocketId) {
                    io.to(requesterSocketId).emit('friend_added', receiver);
                }
            } catch (err) {
                console.error("Accept Friend Error", err);
            }
        });

        socket.on('get_friends_list', async () => {
            const username = connectedUsers.get(socket.id);
            if (!username) return;

            try {
                const user = await User.findOne({ username });
                if (!user) return;

                const richFriends = (user.friends || []).map(fName => ({
                    username: fName,
                    isOnline: onlineUsers.has(fName)
                }));

                socket.emit('friends_list_update', richFriends);
            } catch (err) {
                console.error("Get Friends Error", err);
            }
        });

        socket.on('get_inbox', async () => {
            const username = connectedUsers.get(socket.id);
            if (!username) return;

            try {
                const user = await User.findOne({ username });
                if (!user) return;

                socket.emit('inbox_update', {
                    friendRequests: user.friendRequests || []
                });
            } catch (err) {
                console.error("Get Inbox Error", err);
            }
        });

        // --- Challenge System ---

        socket.on('challenge_friend', (targetUsername) => {
            const challenger = connectedUsers.get(socket.id);
            const targetSocketId = onlineUsers.get(targetUsername);

            if (targetSocketId) {
                console.log(`[Challenge] Sending from ${challenger} to ${targetUsername}`);
                io.to(targetSocketId).emit('challenge_received', { from: challenger });
                socket.emit('challenge_sent', targetUsername);
            } else {
                socket.emit('challenge_error', 'User is offline');
            }
        });

        socket.on('accept_challenge', (challengerUsername) => {
            const acceptor = connectedUsers.get(socket.id);
            const challengerSocketId = onlineUsers.get(challengerUsername);

            if (challengerSocketId) {
                const roomId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                socket.join(roomId);
                const challengerSocket = io.sockets.sockets.get(challengerSocketId);

                if (challengerSocket) {
                    challengerSocket.join(roomId);

                    activeBattles.set(roomId, {
                        p1: { username: challengerUsername, socketId: challengerSocketId, ready: false },
                        p2: { username: acceptor, socketId: socket.id, ready: false }
                    });

                    io.to(roomId).emit('battle_start', { roomId, opponent: 'Friend' });
                }
            }
        });

        socket.on('battle_ready', ({ roomId, team }) => {
            const room = activeBattles.get(roomId);
            if (!room) return;

            const username = connectedUsers.get(socket.id);
            if (!username) return;

            let isP1 = room.p1.socketId === socket.id;
            if (isP1) {
                room.p1.team = team;
                room.p1.ready = true;
            } else {
                room.p2.team = team;
                room.p2.ready = true;
            }

            if (room.p1.ready && room.p2.ready) {
                io.to(roomId).emit('battle_commence', {
                    roomId,
                    p1: { username: room.p1.username, team: room.p1.team },
                    p2: { username: room.p2.username, team: room.p2.team }
                });
            }
        });

        // --- Matchmaking ---

        socket.on('join_matchmaking', (teamData) => {
            const username = connectedUsers.get(socket.id);
            if (!username) return;

            if (mmQueue.find(p => p.username === username)) return;

            mmQueue.push({ socketId: socket.id, username, teamData });
            console.log(`User joined matchmaking: ${username}. Queue size: ${mmQueue.length}`);

            if (mmQueue.length >= 2) {
                const p1 = mmQueue.shift();
                const p2 = mmQueue.shift();
                const roomId = `match_${Date.now()}`;

                const s1 = io.sockets.sockets.get(p1.socketId);
                const s2 = io.sockets.sockets.get(p2.socketId);

                if (s1 && s2) {
                    s1.join(roomId);
                    s2.join(roomId);

                    s1.emit('battle_matched', { roomId, opponent: p2.username, opponentTeam: p2.teamData, isHost: true });
                    s2.emit('battle_matched', { roomId, opponent: p1.username, opponentTeam: p1.teamData, isHost: false });
                }
            }
        });

        // --- Battle Relay ---

        socket.on('battle_action', ({ roomId, action }) => {
            socket.to(roomId).emit('opponent_action', action);
        });

        socket.on('battle_end', async ({ roomId, result }) => {
            console.log(`[Battle End] Winner: ${result.winner}, Loser: ${result.loser}`);

            try {
                const winner = await User.findOne({ username: result.winner });
                const loser = await User.findOne({ username: result.loser });

                if (winner) {
                    if (!winner.pvpStats) winner.pvpStats = { wins: 0, losses: 0, matches: 0, avgLevel: 0 };
                    winner.pvpStats.wins++;
                    winner.pvpStats.matches++;
                    if (result.avgLevel) winner.pvpStats.avgLevel = result.avgLevel;
                    await winner.save();
                }

                if (loser) {
                    if (!loser.pvpStats) loser.pvpStats = { wins: 0, losses: 0, matches: 0, avgLevel: 0 };
                    loser.pvpStats.losses++;
                    loser.pvpStats.matches++;
                    await loser.save();
                }
            } catch (err) {
                console.error("Battle End DB Update Error", err);
            }
        });
    });
}
