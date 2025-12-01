import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Budget from '../models/Budget.js';
import Wallet from '../models/Wallet.js';
import { canEditWallet } from '../utils/roleCheck.js';

const router = express.Router();

// Get all budgets for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const budgets = await Budget.find({
      $or: [
        { userId: req.user.uid },
        { 'collaborators.email': req.user.email }
      ]
    }).sort({ createdAt: -1 });
    res.json({ success: true, budgets });
  } catch (err) {
    console.error('Get budgets error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch budgets' });
  }
});

// Get single budget
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.uid },
        { 'collaborators.email': req.user.email }
      ]
    });
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
    // Check permissions for shared budgets
    if (req.body.plan === 'Shared' && req.body.wallet) {
      const wallet = await Wallet.findOne({ name: req.body.wallet });
      if (wallet && wallet.plan === 'Shared') {
        if (!canEditWallet(wallet, req.user.uid, req.user.email)) {
          return res.status(403).json({ error: 'Forbidden', message: 'Viewers cannot create budgets. Only editors or owner can create budgets in shared wallets.' });
        }
      }
    }
    
    const budgetData = {
      ...req.body,
      userId: req.user.uid
    };
    // For shared budgets, add owner as collaborator
    if (budgetData.plan === 'Shared') {
      budgetData.collaborators = (budgetData.collaborators || []).filter(c => c.email !== req.user.email);
      budgetData.collaborators.unshift({
        firebaseUid: req.user.uid,
        name: req.user.name || 'Unknown',
        email: req.user.email,
        role: 'Owner'
      });
    }
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
    const budget = await Budget.findOne({ _id: req.params.id });
    if (!budget) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found' });
    }
    
    // For shared budgets, check wallet permissions
    if (budget.plan === 'Shared' && budget.wallet) {
      const wallet = await Wallet.findOne({ name: budget.wallet });
      if (wallet && wallet.plan === 'Shared') {
        if (!canEditWallet(wallet, req.user.uid, req.user.email)) {
          return res.status(403).json({ error: 'Forbidden', message: 'Viewers cannot update budgets. Only editors or owner can update budgets in shared wallets.' });
        }
      }
    } else {
      // For personal budgets, check ownership
      const isOwner = budget.userId === req.user.uid;
      if (!isOwner) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      }
    }
    const updated = await Budget.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, budget: updated });
  } catch (err) {
    console.error('Update budget error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id });
    if (!budget) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found' });
    }
    const isOwner = budget.userId === req.user.uid;
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can delete the budget.' });
    }
    await Budget.findOneAndDelete({ _id: req.params.id });
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    console.error('Delete budget error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete budget' });
  }
});

export default router;

