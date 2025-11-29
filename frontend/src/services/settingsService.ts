import axios from 'axios';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

export interface UserSettings {
  userId?: string;
  currency: string;
  // Map of walletId -> boolean (true = visible, false = hidden)
  balanceVisibility?: Record<string, boolean>;
}

const getAuthHeaders = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No ID token available');
  return { Authorization: `Bearer ${token}` };
};

export const getSettings = async (): Promise<UserSettings> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/settings`, { headers });
    return res.data.settings;
  } catch (err) {
    console.error('getSettings failed', err);
    throw err;
  }
};

export const updateSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(`${API_URL}/api/settings`, settings, { headers });
    return res.data.settings;
  } catch (err) {
    console.error('updateSettings failed', err);
    throw err;
  }
};

