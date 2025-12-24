import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

export interface Friend {
    username: string;
    isOnline: boolean;
}

export interface SearchResult {
    username: string;
}

export interface InboxItem {
    from: string;
    timestamp: number;
}

export class NetworkManager {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();
    public connected: boolean = false;
    public username: string | null = null;

    constructor() {
        // Auto-connect handled in connect()
    }

    public connect(username: string): void {
        if (this.socket && this.connected) return;

        this.username = username;
        // Assuming server is on same host or proxied, but per file structure server is on 3001
        // Vite proxy usually handles /socket.io, but if not we might need explicit URL http://localhost:3001
        this.socket = io(API_URL, {
            transports: ['websocket'],
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to PVP Server');
            this.connected = true;
            this.socket?.emit('register_user', this.username);
            this.emitLocal('connected', true);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from PVP Server');
            this.connected = false;
            this.emitLocal('connected', false);
        });

        // --- Proxy Server Events to Local Listeners ---

        const events = [
            'search_results',
            'friend_request_error',
            'friend_request_sent',
            'new_friend_request',
            'friend_added',
            'friends_list_update',
            'inbox_update',
            'challenge_received',
            'challenge_sent',
            'challenge_error',
            'battle_start',
            'battle_commence',
            'battle_matched',
            'battle_action', // Ought to pass this to combat system
            'opponent_action'
        ];

        events.forEach(event => {
            this.socket?.on(event, (data) => {
                this.emitLocal(event, data);
            });
        });
    }

    // --- Public API ---

    public searchUsers(query: string): void {
        this.socket?.emit('search_users', query);
    }

    public sendFriendRequest(targetUsername: string): void {
        this.socket?.emit('send_friend_request', targetUsername);
    }

    public acceptFriendRequest(requesterUsername: string): void {
        this.socket?.emit('accept_friend_request', requesterUsername);
    }

    public getFriendsList(): void {
        this.socket?.emit('get_friends_list');
    }

    public getInbox(): void {
        this.socket?.emit('get_inbox');
    }

    public challengeFriend(targetUsername: string): void {
        this.socket?.emit('challenge_friend', targetUsername);
    }

    public acceptChallenge(challengerUsername: string): void {
        this.socket?.emit('accept_challenge', challengerUsername);
    }

    public joinMatchmaking(teamData: any): void {
        this.socket?.emit('join_matchmaking', teamData);
    }

    public sendBattleAction(roomId: string, action: any): void {
        this.socket?.emit('battle_action', { roomId, action });
    }

    public notifyBattleEnd(roomId: string, result: any): void {
        // Add current player's username to result
        const myUsername = this.username;

        // If we won, we are the winner
        // If we lost, we are the loser (opponent is winner)
        if (result.winner === 'player') {
            result.winner = myUsername;
        } else {
            result.winner = result.loser; // loser field has opponent username
            result.loser = myUsername;
        }

        console.log('[NetworkManager] Sending battle_end:', result);
        this.socket?.emit('battle_end', { roomId, result });
    }

    public emit(event: string, data: any): void {
        this.socket?.emit(event, data);
    }

    // --- Event System ---

    public on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    public off(event: string, callback: Function): void {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event)!;
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    private emitLocal(event: string, data: any): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(cb => cb(data));
        }
    }
}
