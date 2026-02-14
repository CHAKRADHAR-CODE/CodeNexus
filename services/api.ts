
import { User, Topic, DailyChallengeSet, UserProgress, UserRole } from '../types';

/**
 * HYBRID API SERVICE
 * ------------------
 * Attempts to connect to the Node.js backend (Render or Localhost).
 * Falls back to LocalStorage if unreachable.
 */

// REPLACE THIS LINK with your Render URL once you get it!
// Example: 'https://codenexus-backend.onrender.com/api'
const PRODUCTION_API_URL = 'https://codenexus-plw9.onrender.com';
const LOCAL_API_URL = 'http://localhost:5000/api';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? LOCAL_API_URL 
  : PRODUCTION_API_URL;

const mockStore = {
  get: (key: string) => JSON.parse(localStorage.getItem(`cn_mock_${key}`) || 'null'),
  set: (key: string, data: any) => localStorage.setItem(`cn_mock_${key}`, JSON.stringify(data)),
  initialize: () => {
    if (!mockStore.get('users')) {
      mockStore.set('users', [
        { id: '1', email: 'admin@test.com', name: 'Master Admin', role: UserRole.ADMIN, password: '111111', points: 0, streak: 0 },
        { id: '2', email: 'student@test.com', name: 'Chakradhar', role: UserRole.STUDENT, password: '222222', points: 1250, streak: 5 }
      ]);
    }
    if (!mockStore.get('tracks')) mockStore.set('tracks', []);
    if (!mockStore.get('challenges')) mockStore.set('challenges', []);
  }
};

mockStore.initialize();

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(6000) // Increased timeout for cold-booted Render instances
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${res.status}`);
    }
    return res;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.name === 'AbortError' || err.message === 'BACKEND_OFFLINE') {
      console.warn(`[ApiService] Backend unreachable at ${url}. Operating in local mode.`);
      throw new Error('BACKEND_OFFLINE');
    }
    throw err;
  }
};

export const ApiService = {
  async login(email: string, pass: string): Promise<User> {
    try {
      const res = await safeFetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      return res.json();
    } catch (err: any) {
      if (err.message === 'BACKEND_OFFLINE') {
        const users = mockStore.get('users') as User[];
        const user = users.find(u => u.email === email && u.password === pass);
        if (!user) throw new Error('Invalid credentials');
        return user;
      }
      throw err;
    }
  },

  async fetchLeaderboard(): Promise<Partial<User>[]> {
    try {
      const res = await safeFetch(`${API_BASE}/leaderboard`);
      return res.json();
    } catch {
      const users = mockStore.get('users') as User[];
      return users.filter(u => u.role === UserRole.STUDENT).sort((a, b) => (b.points || 0) - (a.points || 0));
    }
  },

  async fetchUsers(): Promise<User[]> {
    try {
      const res = await safeFetch(`${API_BASE}/users`);
      return res.json();
    } catch {
      return mockStore.get('users') || [];
    }
  },

  async blockUser(id: string, isBlocked: boolean): Promise<void> {
    try {
      await safeFetch(`${API_BASE}/users/${id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked })
      });
    } catch {
      const users = mockStore.get('users') as User[];
      mockStore.set('users', users.map(u => u.id === id ? { ...u, isBlocked } : u));
    }
  },

  async fetchTracks(): Promise<Topic[]> {
    try {
      const res = await safeFetch(`${API_BASE}/tracks`);
      return res.json();
    } catch {
      return mockStore.get('tracks') || [];
    }
  },

  async fetchTopicById(id: string): Promise<Topic | null> {
    try {
      const res = await safeFetch(`${API_BASE}/tracks`);
      const all: Topic[] = await res.json();
      return all.find(t => t.id === id) || null;
    } catch {
      const tracks = mockStore.get('tracks') as Topic[];
      return tracks.find(t => t.id === id) || null;
    }
  },

  async saveTrack(track: Topic): Promise<void> {
    try {
      await safeFetch(`${API_BASE}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track)
      });
    } catch {
      const tracks = mockStore.get('tracks') as Topic[];
      const exists = tracks.findIndex(t => t.id === track.id);
      if (exists > -1) tracks[exists] = track;
      else tracks.push(track);
      mockStore.set('tracks', tracks);
    }
  },

  async deleteTrack(id: string): Promise<void> {
    try {
      await safeFetch(`${API_BASE}/tracks/${id}`, { method: 'DELETE' });
    } catch {
      const tracks = mockStore.get('tracks') as Topic[];
      mockStore.set('tracks', tracks.filter(t => t.id !== id));
    }
  },

  async fetchChallenges(): Promise<DailyChallengeSet[]> {
    try {
      const res = await safeFetch(`${API_BASE}/challenges`);
      return res.json();
    } catch {
      return mockStore.get('challenges') || [];
    }
  },

  async fetchProgress(userId: string): Promise<UserProgress | null> {
    try {
      const res = await safeFetch(`${API_BASE}/progress/${userId}`);
      return res.json();
    } catch {
      return mockStore.get(`progress_${userId}`);
    }
  },

  async saveProgress(progress: UserProgress): Promise<void> {
    try {
      await safeFetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
    } catch {
      mockStore.set(`progress_${progress.userId}`, progress);
      const users = mockStore.get('users') as User[];
      mockStore.set('users', users.map(u => u.id === progress.userId ? { ...u, points: progress.points, streak: progress.currentStreak } : u));
    }
  }
};
