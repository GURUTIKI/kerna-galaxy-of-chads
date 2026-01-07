/**
 * AUTH MANAGER
 * 
 * Handles user authentication:
 * - Login
 * - Registration
 * - Session management
 */

import { API_URL } from '../config';

export class AuthManager {
    private apiUrl = API_URL;
    private currentUser: string | null = null;

    constructor() {
        this.currentUser = sessionStorage.getItem('chad_username');
    }

    public async register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                // this.setSession(username); // Removed to enforce manual login after registration
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: 'Server unreachable' };
        }
    }

    public async login(username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                this.setSession(username);
                // Merge friendRequests into the data object so main.ts can access it
                const combinedData = { ...result.data, friendRequests: result.friendRequests };
                return { success: true, data: combinedData };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: 'Server unreachable' };
        }
    }

    public async fetchPlayerData(): Promise<{ success: boolean; data?: any; error?: string }> {
        if (!this.currentUser) return { success: false, error: 'Not logged in' };
        try {
            const response = await fetch(`${this.apiUrl}/player/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.currentUser })
            });

            const result = await response.json();
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: 'Server unreachable' };
        }
    }

    public async savePlayerData(data: any): Promise<void> {
        if (!this.currentUser) return;
        try {
            await fetch(`${this.apiUrl}/player/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.currentUser, data })
            });
        } catch (error) {
            console.error('Failed to sync data to server:', error);
        }
    }

    public async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
        if (!this.currentUser) return { success: false, error: 'Not logged in' };
        try {
            const response = await fetch(`${this.apiUrl}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.currentUser, oldPassword, newPassword })
            });

            const result = await response.json();
            return { success: result.success, error: result.error };
        } catch (error) {
            return { success: false, error: 'Server unreachable' };
        }
    }

    private setSession(username: string): void {
        this.currentUser = username;
        sessionStorage.setItem('chad_username', username);
    }

    public getUsername(): string | null {
        return this.currentUser;
    }

    public isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    public logout(): void {
        this.currentUser = null;
        sessionStorage.removeItem('chad_username');
    }
}
