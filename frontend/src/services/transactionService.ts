import axios from 'axios';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

export interface Transaction {
  _id?: string;
  id?: string;
  userId?: string;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: string;
  dateISO: string | Date;
  category: string;
  walletFrom: string;
  walletTo?: string;
  description?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdAtISO?: string | Date;
  updatedById?: string;
  updatedByName?: string;
  updatedByUsername?: string;
  updatedAtISO?: string | Date;
}

const getAuthHeaders = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No ID token available');
  return { Authorization: `Bearer ${token}` };
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/transactions`, { headers });
    return res.data.transactions.map((t: any) => ({
      ...t,
      id: t._id || t.id,
      dateISO: t.dateISO ? new Date(t.dateISO).toISOString() : t.dateISO,
      createdAtISO: t.createdAtISO ? new Date(t.createdAtISO).toISOString() : t.createdAtISO,
      updatedAtISO: t.updatedAtISO ? new Date(t.updatedAtISO).toISOString() : t.updatedAtISO
    }));
  } catch (err) {
    console.error('getTransactions failed', err);
    throw err;
  }
};

export const getTransaction = async (id: string): Promise<Transaction> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/transactions/${id}`, { headers });
    const tx = res.data.transaction;
    return {
      ...tx,
      id: tx._id || tx.id,
      dateISO: tx.dateISO ? new Date(tx.dateISO).toISOString() : tx.dateISO,
      createdAtISO: tx.createdAtISO ? new Date(tx.createdAtISO).toISOString() : tx.createdAtISO,
      updatedAtISO: tx.updatedAtISO ? new Date(tx.updatedAtISO).toISOString() : tx.updatedAtISO
    };
  } catch (err) {
    console.error('getTransaction failed', err);
    throw err;
  }
};

export const createTransaction = async (transaction: Omit<Transaction, '_id' | 'id' | 'userId'>): Promise<Transaction> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/api/transactions`, transaction, { headers });
    const newTx = res.data.transaction;
    return {
      ...newTx,
      id: newTx._id || newTx.id,
      dateISO: newTx.dateISO ? new Date(newTx.dateISO).toISOString() : newTx.dateISO,
      createdAtISO: newTx.createdAtISO ? new Date(newTx.createdAtISO).toISOString() : newTx.createdAtISO,
      updatedAtISO: newTx.updatedAtISO ? new Date(newTx.updatedAtISO).toISOString() : newTx.updatedAtISO
    };
  } catch (err) {
    console.error('createTransaction failed', err);
    throw err;
  }
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(`${API_URL}/api/transactions/${id}`, transaction, { headers });
    const updatedTx = res.data.transaction;
    return {
      ...updatedTx,
      id: updatedTx._id || updatedTx.id,
      dateISO: updatedTx.dateISO ? new Date(updatedTx.dateISO).toISOString() : updatedTx.dateISO,
      createdAtISO: updatedTx.createdAtISO ? new Date(updatedTx.createdAtISO).toISOString() : updatedTx.createdAtISO,
      updatedAtISO: updatedTx.updatedAtISO ? new Date(updatedTx.updatedAtISO).toISOString() : updatedTx.updatedAtISO
    };
  } catch (err) {
    console.error('updateTransaction failed', err);
    throw err;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/api/transactions/${id}`, { headers });
  } catch (err) {
    console.error('deleteTransaction failed', err);
    throw err;
  }
};

