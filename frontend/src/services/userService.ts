import axios from 'axios';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  username?: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  showEmail: boolean;
  createdAt: any;
  updatedAt: any;
}

export const createOrUpdateProfileBackend = async (profile: { name?: string; username?: string }) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');

    const res = await axios.post(`${API_URL}/api/users`, profile, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user;
  } catch (err) {
    console.warn('createOrUpdateProfileBackend failed', err);
    throw err;
  }
};

export const fetchProfileBackend = async () => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');

    const res = await axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user;
  } catch (err: any) {
    if (err.response?.status === 404) {
      // Profile not found, return default
      return { onboardingCompleted: false };
    }
    console.warn('fetchProfileBackend failed', err);
    throw err;
  }
};

export const updateProfileBackend = async (updates: Partial<UserProfile>) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');

    const allowed = ['name', 'username', 'bio', 'showEmail', 'avatar', 'coverPhoto', 'header'];
    const filtered: any = {};
    for (const key of allowed) {
      if (key === 'coverPhoto' && (updates as any)['coverPhoto']) {
        filtered['header'] = (updates as any)['coverPhoto'];
      } else if (key !== 'coverPhoto' && key in updates) {
        filtered[key] = (updates as any)[key];
      }
    }

    const res = await axios.put(`${API_URL}/api/users/me`, filtered, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user;
  } catch (err) {
    console.warn('updateProfileBackend failed', err);
    throw err;
  }
};

export const changeEmailBackend = async ({ newEmail, password }: { newEmail: string; password: string }) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.post(`${API_URL}/api/users/me/email`, { newEmail, password }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user;
  } catch (err) {
    console.warn('changeEmailBackend failed', err);
    throw err;
  }
};

export const changeUsernameBackend = async ({ newUsername, password }: { newUsername: string; password: string }) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.post(`${API_URL}/api/users/me/username`, { newUsername, password }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user;
  } catch (err) {
    console.warn('changeUsernameBackend failed', err);
    throw err;
  }
};

export const markOnboardingCompleted = async () => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.put(`${API_URL}/api/users/me`, { onboardingCompleted: true }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.user;
  } catch (err) {
    console.warn('markOnboardingCompleted failed', err);
    throw err;
  }
};

