import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Budget from '../models/Budget.js';

const router = express.Router();

// Get all budgets for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json({ success: true, budgets });
  } catch (err) {
    console.error('Get budgets error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch budgets' });
  }
});

// Get single budget
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!budget) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found' });
    }
    res.json({ success: true, budget });
  } catch (err) {
    console.error('Get budget error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch budget' });
  }
});

// Create budget
router.post('/', verifyToken, async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      userId: req.user.uid
    };
    const budget = new Budget(budgetData);
    await budget.save();
    res.status(201).json({ success: true, budget });
  } catch (err) {
    console.error('Create budget error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create budget' });
  }
});

// Update budget
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      req.body,
      { new: true }
    );
    if (!budget) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found' });
    }
    res.json({ success: true, budget });
  } catch (err) {
    console.error('Update budget error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    if (!budget) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found' });
    }
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    console.error('Delete budget error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete budget' });
  }
});

export default router;

