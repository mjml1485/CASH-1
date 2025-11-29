import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, users: [] });
    }
    const query = q.trim();
    const users = await User.find({
      $and: [
        { firebaseUid: { $ne: req.user.uid } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('firebaseUid name username email').limit(10);
    res.json({ success: true, users });
  } catch (err) {
    console.error('Search users error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to search users' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { name, username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Bad Request', message: 'Username is required' });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { firebaseUid: uid, email, name, username },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error('Create user error:', err?.message || err);
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Username or email already exists' });
    }
    const message = process.env.NODE_ENV === 'production' ? 'Failed to create profile' : (err && err.message ? err.message : 'Failed to create profile');
    res.status(500).json({ error: 'Internal Server Error', message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid }).select('-__v');
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Get profile error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch profile' });
  }
});

router.put('/me', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const updates = req.body;

    delete updates.firebaseUid;
    delete updates.email;

    const allowedFields = ['name', 'username', 'bio', 'avatar', 'header', 'showEmail', 'onboardingCompleted'];
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) filteredUpdates[key] = updates[key];
    }

    const user = await User.findOneAndUpdate({ firebaseUid: uid }, filteredUpdates, { new: true });
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Update profile error:', err?.message || err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update profile' });
  }
});

router.post('/me/email', verifyToken, async (req, res) => {

  try {
    const { uid, email: currentEmail } = req.user;
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'New email and password are required.' });
    }

    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already in use.' });
    }

    const admin = (await import('../config/firebase.js')).default;
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found in Firebase.' });
    }

    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      console.error('FIREBASE_API_KEY is missing from environment variables.');
      return res.status(500).json({ error: 'Server Error', message: 'Firebase API key not configured on backend. Please set FIREBASE_API_KEY in your .env file.' });
    }
    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, password, returnSecureToken: true })
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Password is incorrect.' });
    }

    try {
      await admin.auth().updateUser(uid, { email: newEmail });
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Conflict', message: 'Email already in use.' });
      }
      return res.status(500).json({ error: 'Server Error', message: 'Failed to update email in Firebase.' });
    }

    const user = await User.findOneAndUpdate({ firebaseUid: uid }, { email: newEmail }, { new: true });
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Change email error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to change email' });
  }
});

router.post('/me/username', verifyToken, async (req, res) => {
  try {
    const { uid, email: currentEmail } = req.user;
    const { newUsername, password } = req.body;
    if (!newUsername || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'New username and password are required.' });
    }

    const existing = await User.findOne({ username: newUsername });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already in use.' });
    }

    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      console.error('FIREBASE_API_KEY is missing from environment variables.');
      return res.status(500).json({ error: 'Server Error', message: 'Firebase API key not configured on backend. Please set FIREBASE_API_KEY in your .env file.' });
    }

    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, password, returnSecureToken: true })
    });
    if (!resp.ok) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Password is incorrect.' });
    }

    const user = await User.findOneAndUpdate({ firebaseUid: uid }, { username: newUsername }, { new: true });
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Change username error:', err?.message || err);
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to change username' });
  }
});

export default router;
