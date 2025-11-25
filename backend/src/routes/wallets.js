import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';
import Budget from '../models/Budget.js';

const router = express.Router();

// Get all wallets for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json({ success: true, wallets });
  } catch (err) {
    console.error('Get wallets error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch wallets' });
  }
});

// Get single wallet
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!wallet) {
      return res.status(404).json({ error: 'Not Found', message: 'Wallet not found' });
    }
    res.json({ success: true, wallet });
  } catch (err) {
    console.error('Get wallet error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch wallet' });
  }
});

// Create wallet
router.post('/', verifyToken, async (req, res) => {
  try {
    const walletData = {
      ...req.body,
      userId: req.user.uid
    };
    const wallet = new Wallet(walletData);
    await wallet.save();
    res.status(201).json({ success: true, wallet });
  } catch (err) {
    console.error('Create wallet error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create wallet' });
  }
});

// Update wallet
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      req.body,
      { new: true }
    );
    if (!wallet) {
      return res.status(404).json({ error: 'Not Found', message: 'Wallet not found' });
    }
    res.json({ success: true, wallet });
  } catch (err) {
    console.error('Update wallet error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update wallet' });
  }
});

// Delete wallet
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!wallet) {
      return res.status(404).json({ error: 'Not Found', message: 'Wallet not found' });
    }

    // If shared wallet, delete associated shared budgets
    if (wallet.plan === 'Shared') {
      await Budget.deleteMany({ userId: req.user.uid, wallet: wallet.name, plan: 'Shared' });
    }

    await Wallet.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    res.json({ success: true, message: 'Wallet deleted' });
  } catch (err) {
    console.error('Delete wallet error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete wallet' });
  }
});

export default router;

