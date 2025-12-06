import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';
import Budget from '../models/Budget.js';
import { canEditWallet, isOwner } from '../utils/roleCheck.js';

const router = express.Router();

// Get all wallets for user
router.get('/', verifyToken, async (req, res) => {
  try {
    // Show wallets where user is owner or collaborator (editor/viewer)
    const wallets = await Wallet.find({
      $or: [
        { userId: req.user.uid },
        { 'collaborators.email': req.user.email }
      ]
    }).sort({ createdAt: -1 });
    
    // Deduplicate wallets by _id to prevent duplicates (e.g., if user is both owner and collaborator)
    const uniqueWallets = [];
    const seenIds = new Set();
    for (const wallet of wallets) {
      const walletId = wallet._id.toString();
      if (!seenIds.has(walletId)) {
        seenIds.add(walletId);
        uniqueWallets.push(wallet);
      }
    }
    
    res.json({ success: true, wallets: uniqueWallets });
  } catch (err) {
    console.error('Get wallets error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch wallets' });
  }
});

// Get single wallet
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Allow access if user is owner or collaborator
    const wallet = await Wallet.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.uid },
        { 'collaborators.email': req.user.email }
      ]
    });
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
    // For shared wallets, add owner as collaborator
    if (walletData.plan === 'Shared') {
      const owner = {
        firebaseUid: req.user.uid,
        name: req.user.name || 'Unknown',
        email: req.user.email,
        role: 'Owner'
      };
      walletData.collaborators = [owner, ...(walletData.collaborators || [])];
    }
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
    // Only owner can update collaborators or delete wallet
    const wallet = await Wallet.findOne({ _id: req.params.id });
    if (!wallet) {
      return res.status(404).json({ error: 'Not Found', message: 'Wallet not found' });
    }
    const userIsOwner = isOwner(wallet, req.user.uid, req.user.email);
    // If updating collaborators or deleting, only owner allowed
    if ((req.body.collaborators !== undefined || req.body.delete) && !userIsOwner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can manage collaborators or delete the wallet.' });
    }
    // For other updates, allow owner or editor (not viewers)
    if (!canEditWallet(wallet, req.user.uid, req.user.email)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Viewers cannot update wallets. Only editors or owner can update wallet.' });
    }
    // Prevent non-owners from updating collaborators
    if (!isOwner && req.body.collaborators !== undefined) {
      delete req.body.collaborators;
    }
    const updated = await Wallet.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, wallet: updated });
  } catch (err) {
    console.error('Update wallet error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update wallet' });
  }
});

// Delete wallet
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id });
    if (!wallet) {
      return res.status(404).json({ error: 'Not Found', message: 'Wallet not found' });
    }
    const userIsOwner = isOwner(wallet, req.user.uid, req.user.email);
    if (!userIsOwner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can delete the wallet.' });
    }
    // If shared wallet, delete associated shared budgets
    if (wallet.plan === 'Shared') {
      await Budget.deleteMany({ wallet: wallet.name, plan: 'Shared' });
    }
    await Wallet.findOneAndDelete({ _id: req.params.id });
    res.json({ success: true, message: 'Wallet deleted' });
  } catch (err) {
    console.error('Delete wallet error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete wallet' });
  }
});

export default router;

