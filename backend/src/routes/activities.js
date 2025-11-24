import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// Get all activities for user (optionally filtered by walletId)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { walletId } = req.query;
    const query = { userId: req.user.uid };
    if (walletId) query.walletId = walletId;
    
    const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, activities });
  } catch (err) {
    console.error('Get activities error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch activities' });
  }
});

// Create activity
router.post('/', verifyToken, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.user.uid,
      actorId: req.body.actorId || req.user.uid,
      actorName: req.body.actorName || req.user.name
    };
    const activity = new Activity(activityData);
    await activity.save();
    
    // Keep only last 200 activities per user
    const count = await Activity.countDocuments({ userId: req.user.uid });
    if (count > 200) {
      const oldest = await Activity.find({ userId: req.user.uid })
        .sort({ createdAt: 1 })
        .limit(count - 200)
        .select('_id');
      await Activity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
    }
    
    res.status(201).json({ success: true, activity });
  } catch (err) {
    console.error('Create activity error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create activity' });
  }
});

export default router;

