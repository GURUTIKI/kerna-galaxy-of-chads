export function setupSocketHandlers(io, getDb, saveDb) {
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

            // Notify friends that user is online?
            // For now, client polls or we push status updates later.
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

        socket.on('search_users', (query) => {
            if (!query) return;
            const db = getDb();
            const matches = db.users
                .filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
                .map(u => ({ username: u.username })); // Only send usernames
            socket.emit('search_results', matches);
        });

        socket.on('send_friend_request', (targetUsername) => {
            const sender = connectedUsers.get(socket.id);
            if (!sender) return;

            const db = getDb();
            const target = db.users.find(u => u.username === targetUsername);
            const senderUser = db.users.find(u => u.username === sender);

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

            target.friendRequests.push({ from: sender, timestamp: Date.now() });
            saveDb(db);

            // Notify target if online
            const targetSocketId = onlineUsers.get(targetUsername);
            if (targetSocketId) {
                io.to(targetSocketId).emit('new_friend_request', { from: sender });
            }

            socket.emit('friend_request_sent', targetUsername);
        });

        socket.on('accept_friend_request', (requesterUsername) => {
            const receiver = connectedUsers.get(socket.id);
            if (!receiver) return;

            const db = getDb();
            const receiverUser = db.users.find(u => u.username === receiver);
            const requesterUser = db.users.find(u => u.username === requesterUsername);

            if (!receiverUser || !requesterUser) return;

            // Add each other
            // Add each other
            if (!receiverUser.friends) receiverUser.friends = [];
            if (!requesterUser.friends) requesterUser.friends = [];
            receiverUser.friends.push(requesterUsername);
            requesterUser.friends.push(receiver);

            // Remove request
            receiverUser.friendRequests = receiverUser.friendRequests.filter(r => r.from !== requesterUsername);

            saveDb(db);

            // Notify both
            socket.emit('friend_added', requesterUsername);
            const requesterSocketId = onlineUsers.get(requesterUsername);
            if (requesterSocketId) {
                io.to(requesterSocketId).emit('friend_added', receiver);
            }
        });

        socket.on('get_friends_list', () => {
            const username = connectedUsers.get(socket.id);
            if (!username) return;

            const db = getDb();
            const user = db.users.find(u => u.username === username);
            if (!user) return;

            // Enrich with online status
            // Enrich with online status
            const richFriends = (user.friends || []).map(fName => ({
                username: fName,
                isOnline: onlineUsers.has(fName)
            }));

            socket.emit('friends_list_update', richFriends);
        });

        socket.on('get_inbox', () => {
            const username = connectedUsers.get(socket.id);
            if (!username) return;

            const db = getDb();
            const user = db.users.find(u => u.username === username);
            if (!user) return;

            socket.emit('inbox_update', {
                friendRequests: user.friendRequests || []
            });
        });

        // --- Challenge System ---

        socket.on('challenge_friend', (targetUsername) => {
            const challenger = connectedUsers.get(socket.id);
            const targetSocketId = onlineUsers.get(targetUsername);

            if (targetSocketId) {
                console.log(`[Challenge] Sending from ${challenger} to ${targetUsername} (Socket: ${targetSocketId})`);
                io.to(targetSocketId).emit('challenge_received', { from: challenger });
                socket.emit('challenge_sent', targetUsername);
            } else {
                console.log(`[Challenge] Target ${targetUsername} NOT online (Map: ${Array.from(onlineUsers.keys())})`);
                socket.emit('challenge_error', 'User is offline');
            }
        });

        socket.on('accept_challenge', (challengerUsername) => {
            const acceptor = connectedUsers.get(socket.id);
            const challengerSocketId = onlineUsers.get(challengerUsername);

            if (challengerSocketId) {
                // Create room
                const roomId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                socket.join(roomId);
                const challengerSocket = io.sockets.sockets.get(challengerSocketId);

                if (challengerSocket) {
                    challengerSocket.join(roomId);

                    // valid socket ids
                    const p1SocketId = challengerSocketId;
                    const p2SocketId = socket.id;

                    // Init Room State
                    activeBattles.set(roomId, {
                        p1: { username: challengerUsername, socketId: p1SocketId, ready: false },
                        p2: { username: acceptor, socketId: p2SocketId, ready: false }
                    });

                    io.to(roomId).emit('battle_start', { roomId, opponent: 'Friend' });
                }
            }
        });

        socket.on('battle_ready', ({ roomId, team }) => {
            console.log(`[BattleDebug] battle_ready received from ${socket.id} for room ${roomId}`);
            const room = activeBattles.get(roomId);
            if (!room) {
                console.log(`[BattleDebug] Room ${roomId} not found in activeBattles!`);
                return;
            }

            const username = connectedUsers.get(socket.id);
            if (!username) return;

            // TRUST CLIENT DATA (Temporary Fix for Dev)
            // Since server DB might be out of sync or empty, we accept the full character objects from client.
            // Security Note: In production, we MUST validate this against DB.

            const fullTeam = team;
            console.log(`[BattleDebug] Using Client Team Data for ${username}. Size: ${fullTeam.length}`);

            let isP1 = room.p1.socketId === socket.id;
            if (isP1) {
                room.p1.team = fullTeam;
                room.p1.ready = true;
                console.log(`[BattleDebug] P1 (${room.p1.username}) Ready!`);
            } else {
                room.p2.team = fullTeam;
                room.p2.ready = true;
                console.log(`[BattleDebug] P2 (${room.p2.username}) Ready!`);
            }

            if (room.p1.ready && room.p2.ready) {
                console.log(`[BattleDebug] All Ready. Commencing Battle in ${roomId}`);
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

            // Check if already in queue
            if (mmQueue.find(p => p.username === username)) return;

            // Add self
            const player = { socketId: socket.id, username, teamData };
            mmQueue.push(player);
            console.log(`User joined matchmaking: ${username}. Queue size: ${mmQueue.length}`);

            // Try to match
            if (mmQueue.length >= 2) {
                const p1 = mmQueue.shift();
                const p2 = mmQueue.shift();

                const roomId = `match_${Date.now()}`;

                const s1 = io.sockets.sockets.get(p1.socketId);
                const s2 = io.sockets.sockets.get(p2.socketId);

                if (s1 && s2) {
                    s1.join(roomId);
                    s2.join(roomId);

                    // Send start + opponent data
                    s1.emit('battle_matched', { roomId, opponent: p2.username, opponentTeam: p2.teamData, isHost: true });
                    s2.emit('battle_matched', { roomId, opponent: p1.username, opponentTeam: p1.teamData, isHost: false });

                    console.log(`Match created: ${p1.username} vs ${p2.username}`);
                }
            }
        });

        // --- Battle Relay ---

        socket.on('battle_action', ({ roomId, action }) => {
            socket.to(roomId).emit('opponent_action', action);
        });

        socket.on('battle_end', ({ roomId, result }) => {
            // result: { winner: username, loser: username, avgLevel: number }
            const db = getDb();
            const winner = db.users.find(u => u.username === result.winner);
            const loser = db.users.find(u => u.username === result.loser);

            console.log(`[Battle End] Winner: ${result.winner}, Loser: ${result.loser || 'unknown'}`);

            // Update winner stats
            if (winner) {
                if (!winner.pvpStats) {
                    winner.pvpStats = { wins: 0, losses: 0, matches: 0 };
                }
                winner.pvpStats.wins++;
                winner.pvpStats.matches++;
                if (result.avgLevel) {
                    winner.pvpStats.avgLevel = result.avgLevel;
                }
                console.log(`Updated ${winner.username}: ${winner.pvpStats.wins} wins`);
            }

            // Update loser stats
            if (loser) {
                if (!loser.pvpStats) {
                    loser.pvpStats = { wins: 0, losses: 0, matches: 0 };
                }
                loser.pvpStats.losses++;
                loser.pvpStats.matches++;
                console.log(`Updated ${loser.username}: ${loser.pvpStats.losses} losses`);
            }

            saveDb(db);
        });
    });
}
