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

export interface FollowUser {
  firebaseUid: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface UserNotification {
  _id: string;
  userId: string;
  type: 'follow' | 'follow_back';
  actorId: string;
  actorName: string;
  actorUsername: string;
  read: boolean;
  createdAt: string;
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

export const searchUsers = async (query: string) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');

    const res = await axios.get(`${API_URL}/api/users/search`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.users;
  } catch (err) {
    console.warn('searchUsers failed', err);
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

export const followUser = async (userId: string) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.post(`${API_URL}/api/users/${userId}/follow`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.warn('followUser failed', err);
    throw err;
  }
};

export const unfollowUser = async (userId: string) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.delete(`${API_URL}/api/users/${userId}/follow`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.warn('unfollowUser failed', err);
    throw err;
  }
};

export const getFollowing = async (): Promise<FollowUser[]> => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.get(`${API_URL}/api/users/me/following`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.users;
  } catch (err) {
    console.warn('getFollowing failed', err);
    throw err;
  }
};

export const getFollowers = async (): Promise<FollowUser[]> => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.get(`${API_URL}/api/users/me/followers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.users;
  } catch (err) {
    console.warn('getFollowers failed', err);
    throw err;
  }
};

export const removeFollower = async (followerId: string) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.delete(`${API_URL}/api/users/me/followers/${followerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.warn('removeFollower failed', err);
    throw err;
  }
};

export interface PublicUserProfile {
  firebaseUid: string;
  name: string;
  username: string;
  email: string | null;
  bio: string;
  avatar: string;
  header: string;
  followersCount: number;
  followingCount: number;
  relationship: 'none' | 'following' | 'followed_by' | 'friends';
  isOwnProfile: boolean;
}

export const getUserProfile = async (userId: string): Promise<PublicUserProfile> => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.get(`${API_URL}/api/users/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.profile;
  } catch (err) {
    console.warn('getUserProfile failed', err);
    throw err;
  }
};

export const getNotifications = async (): Promise<UserNotification[]> => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.get(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.notifications;
  } catch (err) {
    console.warn('getNotifications failed', err);
    throw err;
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.get(`${API_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.count;
  } catch (err) {
    console.warn('getUnreadNotificationCount failed', err);
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.put(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.warn('markNotificationAsRead failed', err);
    throw err;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.warn('markAllNotificationsAsRead failed', err);
    throw err;
  }
};

export const followBackFromNotification = async (notificationId: string) => {
  try {
    const { getIdToken } = await import('./authService');
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    const res = await axios.post(`${API_URL}/api/notifications/${notificationId}/follow-back`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.warn('followBackFromNotification failed', err);
    throw err;
  }
};
