import axios from 'axios';
import { getIdToken } from './authService';
import type { CommentEntry } from '../state/AppStateContext';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

const getAuthHeaders = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No ID token available');
  return { Authorization: `Bearer ${token}` };
};

export const getComments = async (walletId?: string, entityId?: string): Promise<CommentEntry[]> => {
  try {
    const headers = await getAuthHeaders();
    const params: any = {};
    if (walletId) params.walletId = walletId;
    if (entityId) params.entityId = entityId;
    const res = await axios.get(`${API_URL}/api/comments`, { headers, params });
    return res.data.comments.map((c: any) => ({
      ...c,
      id: c._id || c.id,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : c.createdAt
    }));
  } catch (err) {
    console.error('getComments failed', err);
    throw err;
  }
};

export const createComment = async (comment: Omit<CommentEntry, 'id' | 'createdAt'>): Promise<CommentEntry> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/api/comments`, comment, { headers });
    const newComment = res.data.comment;
    return {
      ...newComment,
      id: newComment._id || newComment.id,
      createdAt: newComment.createdAt ? new Date(newComment.createdAt).toISOString() : newComment.createdAt
    };
  } catch (err) {
    console.error('createComment failed', err);
    throw err;
  }
};

