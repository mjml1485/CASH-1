import axios from 'axios';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

export interface Wallet {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  balance: string;
  plan: 'Personal' | 'Shared';
  walletType: string;
  backgroundColor?: string;
  textColor?: string;
  color1?: string;
  color2?: string;
  template?: string;
  description?: string;
  collaborators?: Array<{
    firebaseUid: string;
    name: string;
    email: string;
    role: string;
  }>;
}

const getAuthHeaders = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No ID token available');
  return { Authorization: `Bearer ${token}` };
};

export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/wallets`, { headers });
    return res.data.wallets.map((w: any) => ({
      ...w,
      id: w._id || w.id
    }));
  } catch (err) {
    console.error('getWallets failed', err);
    throw err;
  }
};

export const getWallet = async (id: string): Promise<Wallet> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/wallets/${id}`, { headers });
    return { ...res.data.wallet, id: res.data.wallet._id || res.data.wallet.id };
  } catch (err) {
    console.error('getWallet failed', err);
    throw err;
  }
};

export const createWallet = async (wallet: Omit<Wallet, '_id' | 'id' | 'userId'>): Promise<Wallet> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/api/wallets`, wallet, { headers });
    return { ...res.data.wallet, id: res.data.wallet._id || res.data.wallet.id };
  } catch (err) {
    console.error('createWallet failed', err);
    throw err;
  }
};

export const updateWallet = async (id: string, wallet: Partial<Wallet>): Promise<Wallet> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(`${API_URL}/api/wallets/${id}`, wallet, { headers });
    return { ...res.data.wallet, id: res.data.wallet._id || res.data.wallet.id };
  } catch (err) {
    console.error('updateWallet failed', err);
    throw err;
  }
};

export const deleteWallet = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/api/wallets/${id}`, { headers });
  } catch (err) {
    console.error('deleteWallet failed', err);
    throw err;
  }
};

