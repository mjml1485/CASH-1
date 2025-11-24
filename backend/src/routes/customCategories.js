import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import CustomCategory from '../models/CustomCategory.js';

const router = express.Router();

// Get all custom categories for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const categories = await CustomCategory.find({ userId: req.user.uid }).sort({ category: 1 });
    const categoryList = categories.map(c => c.category);
    res.json({ success: true, categories: categoryList });
  } catch (err) {
    console.error('Get custom categories error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch custom categories' });
  }
});

// Create custom category
router.post('/', verifyToken, async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Bad Request', message: 'Category is required' });
    }
    
    const customCategory = new CustomCategory({
      userId: req.user.uid,
      category: category.trim()
    });
    
    try {
      await customCategory.save();
      res.status(201).json({ success: true, category: customCategory.category });
    } catch (err) {
      if (err.code === 11000) {
        // Already exists, return success
        res.json({ success: true, category: customCategory.category });
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Create custom category error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create custom category' });
  }
});

export default router;

