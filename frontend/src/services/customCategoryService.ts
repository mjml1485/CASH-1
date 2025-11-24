import axios from 'axios';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

const getAuthHeaders = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No ID token available');
  return { Authorization: `Bearer ${token}` };
};

export const getCustomCategories = async (): Promise<string[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/custom-categories`, { headers });
    return res.data.categories || [];
  } catch (err) {
    console.error('getCustomCategories failed', err);
    throw err;
  }
};

export const createCustomCategory = async (category: string): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/api/custom-categories`, { category }, { headers });
    return res.data.category;
  } catch (err) {
    console.error('createCustomCategory failed', err);
    throw err;
  }
};

