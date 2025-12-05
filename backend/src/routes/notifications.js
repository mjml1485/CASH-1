import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const notifications = await Notification.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Get notifications error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const count = await Notification.countDocuments({ userId: uid, read: false });
    res.json({ success: true, count });
  } catch (err) {
    console.error('Get unread count error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: uid },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (err) {
    console.error('Mark notification read error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    await Notification.updateMany({ userId: uid, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to mark all notifications as read' });
  }
});

// Follow back from notification
router.post('/:notificationId/follow-back', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { notificationId } = req.params;
    
    // Get notification
    const notification = await Notification.findOne({ _id: notificationId, userId: uid, type: 'follow' });
    if (!notification) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
    }
    
    const actorId = notification.actorId;
    
    // Check if already following
    const existingFollow = await Follow.findOne({ followerId: uid, followingId: actorId });
    if (existingFollow) {
      return res.status(409).json({ error: 'Conflict', message: 'Already following this user' });
    }
    
    // Create follow relationship
    await Follow.create({ followerId: uid, followingId: actorId });
    
    // Mark notification as read
    notification.read = true;
    await notification.save();
    
    res.json({ success: true, message: 'Followed back successfully' });
  } catch (err) {
    console.error('Follow back error:', err?.message || err);
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Already following this user' });
    }
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to follow back' });
  }
});

export default router;

