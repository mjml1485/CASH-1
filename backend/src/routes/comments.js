import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Comment from '../models/Comment.js';

const router = express.Router();

// Get comments (optionally filtered by walletId and/or entityId)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { walletId, entityId } = req.query;
    const query = { userId: req.user.uid };
    if (walletId) query.walletId = walletId;
    if (entityId) query.entityId = entityId;
    
    const comments = await Comment.find(query).sort({ createdAt: 1 }).limit(200);
    res.json({ success: true, comments });
  } catch (err) {
    console.error('Get comments error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/', verifyToken, async (req, res) => {
  try {
    const commentData = {
      ...req.body,
      userId: req.user.uid,
      authorId: req.body.authorId || req.user.uid,
      authorName: req.body.authorName || req.user.name
    };
    const comment = new Comment(commentData);
    await comment.save();
    
    // Keep only last 200 comments per user
    const count = await Comment.countDocuments({ userId: req.user.uid });
    if (count > 200) {
      const oldest = await Comment.find({ userId: req.user.uid })
        .sort({ createdAt: 1 })
        .limit(count - 200)
        .select('_id');
      await Comment.deleteMany({ _id: { $in: oldest.map(c => c._id) } });
    }
    
    res.status(201).json({ success: true, comment });
  } catch (err) {
    console.error('Create comment error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create comment' });
  }
});

export default router;

