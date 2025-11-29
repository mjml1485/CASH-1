import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import UserSettings from '../models/UserSettings.js';

const router = express.Router();

// Get user settings
router.get('/', verifyToken, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user.uid });
    if (!settings) {
      // Create default settings if they don't exist
      settings = new UserSettings({
        userId: req.user.uid,
        currency: 'PHP'
      });
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Get settings error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['currency', 'balanceVisibility'];
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) filteredUpdates[key] = updates[key];
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.uid },
      filteredUpdates,
      { upsert: true, new: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Update settings error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update settings' });
  }
});

export default router;

