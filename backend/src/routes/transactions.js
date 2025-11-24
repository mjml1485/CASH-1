import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Get all transactions for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.uid }).sort({ dateISO: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    console.error('Get transactions error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch transactions' });
  }
});

// Get single transaction
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!transaction) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (err) {
    console.error('Get transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch transaction' });
  }
});

// Create transaction
router.post('/', verifyToken, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      userId: req.user.uid,
      dateISO: req.body.dateISO ? new Date(req.body.dateISO) : new Date(),
      createdAtISO: req.body.createdAtISO ? new Date(req.body.createdAtISO) : new Date(),
      updatedAtISO: new Date()
    };
    const transaction = new Transaction(transactionData);
    await transaction.save();
    res.status(201).json({ success: true, transaction });
  } catch (err) {
    console.error('Create transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAtISO: new Date()
    };
    if (updateData.dateISO) updateData.dateISO = new Date(updateData.dateISO);
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      updateData,
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (err) {
    console.error('Update transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    if (!transaction) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete transaction' });
  }
});

export default router;

