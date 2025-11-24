import axios from 'axios';
import { getIdToken } from './authService';
import type { ActivityEntry } from '../state/AppStateContext';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

const getAuthHeaders = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No ID token available');
  return { Authorization: `Bearer ${token}` };
};

export const getActivities = async (walletId?: string): Promise<ActivityEntry[]> => {
  try {
    const headers = await getAuthHeaders();
    const params = walletId ? { walletId } : {};
    const res = await axios.get(`${API_URL}/api/activities`, { headers, params });
    return res.data.activities.map((a: any) => ({
      ...a,
      id: a._id || a.id,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : a.createdAt
    }));
  } catch (err) {
    console.error('getActivities failed', err);
    throw err;
  }
};

export const createActivity = async (activity: Omit<ActivityEntry, 'id' | 'createdAt'>): Promise<ActivityEntry> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/api/activities`, activity, { headers });
    const newActivity = res.data.activity;
    return {
      ...newActivity,
      id: newActivity._id || newActivity.id,
      createdAt: newActivity.createdAt ? new Date(newActivity.createdAt).toISOString() : newActivity.createdAt
    };
  } catch (err) {
    console.error('createActivity failed', err);
    throw err;
  }
};

