import express from 'express';
import admin from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email and password are required' 
      });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name || email.split('@')[0],
      emailVerified: false,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
      },
    });
  } catch (error) {
    console.error('Signup error:', error?.message || error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'Email already exists' 
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Invalid email format' 
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Password is too weak' 
      });
    }

    const message = process.env.NODE_ENV === 'production' ? 'Failed to create user' : (error && error.message ? error.message : 'Failed to create user');
    res.status(500).json({ 
      error: 'Internal server error', 
      message
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token is required' 
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || userRecord.email?.split('@')[0],
        emailVerified: userRecord.emailVerified,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error?.message || error);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const userRecord = await admin.auth().getUser(req.user.uid);

    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || userRecord.email?.split('@')[0],
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
      },
    });
  } catch (error) {
    console.error('Get user error:', error?.message || error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to get user info' 
    });
  }
});

export default router;

