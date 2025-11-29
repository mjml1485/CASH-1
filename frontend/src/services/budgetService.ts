import axios from 'axios';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

export interface Budget {
  _id?: string;
  id?: string;
  userId?: string;
  wallet: string;
  plan: 'Personal' | 'Shared';
  amount: string;
  left: string;
  category: string;
  period: 'Weekly' | 'Monthly' | 'One-time';
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
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

export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/budgets`, { headers });
    return res.data.budgets.map((b: any) => ({
      ...b,
      id: b._id || b.id,
      startDate: b.startDate ? new Date(b.startDate) : undefined,
      endDate: b.endDate ? new Date(b.endDate) : undefined
    }));
  } catch (err) {
    console.error('getBudgets failed', err);
    throw err;
  }
};

export const getBudget = async (id: string): Promise<Budget> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/api/budgets/${id}`, { headers });
    const budget = res.data.budget;
    return {
      ...budget,
      id: budget._id || budget.id,
      startDate: budget.startDate ? new Date(budget.startDate) : undefined,
      endDate: budget.endDate ? new Date(budget.endDate) : undefined
    };
  } catch (err) {
    console.error('getBudget failed', err);
    throw err;
  }
};

export const createBudget = async (budget: Omit<Budget, '_id' | 'id' | 'userId'>): Promise<Budget> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/api/budgets`, budget, { headers });
    const newBudget = res.data.budget;
    return {
      ...newBudget,
      id: newBudget._id || newBudget.id,
      startDate: newBudget.startDate ? new Date(newBudget.startDate) : undefined,
      endDate: newBudget.endDate ? new Date(newBudget.endDate) : undefined
    };
  } catch (err) {
    console.error('createBudget failed', err);
    throw err;
  }
};

export const updateBudget = async (id: string, budget: Partial<Budget>): Promise<Budget> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(`${API_URL}/api/budgets/${id}`, budget, { headers });
    const updatedBudget = res.data.budget;
    return {
      ...updatedBudget,
      id: updatedBudget._id || updatedBudget.id,
      startDate: updatedBudget.startDate ? new Date(updatedBudget.startDate) : undefined,
      endDate: updatedBudget.endDate ? new Date(updatedBudget.endDate) : undefined
    };
  } catch (err) {
    console.error('updateBudget failed', err);
    throw err;
  }
};

export const deleteBudget = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/api/budgets/${id}`, { headers });
  } catch (err) {
    console.error('deleteBudget failed', err);
    throw err;
  }
};

