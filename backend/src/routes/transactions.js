import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Activity from '../models/Activity.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();

// Get all transactions for user
router.get('/', verifyToken, async (req, res) => {
  try {
    // Get wallets user has access to
    const wallets = await Wallet.find({
      $or: [
        { userId: req.user.uid },
        { 'collaborators.email': req.user.email }
      ]
    }).select('name');
    const walletNames = wallets.map(w => w.name);
    const transactions = await Transaction.find({
      $or: [
        { userId: req.user.uid },
        { walletFrom: { $in: walletNames } }
      ]
    }).sort({ dateISO: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    console.error('Get transactions error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch transactions' });
  }
});

// Get single transaction
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id });
    if (!transaction) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found' });
    }
    // Check if user has access to the wallet
    const wallet = await Wallet.findOne({
      name: transaction.walletFrom,
      $or: [
        { userId: req.user.uid },
        { 'collaborators.email': req.user.email }
      ]
    });
    if (!wallet && transaction.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
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
    // Check permissions for shared wallets
    if (req.body.walletFrom) {
      const wallet = await Wallet.findOne({ name: req.body.walletFrom });
      if (wallet && wallet.plan === 'Shared') {
        const isOwner = wallet.userId === req.user.uid;
        let isEditor = false;
        if (!isOwner && wallet.collaborators) {
          const collab = wallet.collaborators.find(c => c.email === req.user.email);
          isEditor = collab && collab.role === 'Editor';
        }
        if (!isOwner && !isEditor) {
          return res.status(403).json({ error: 'Forbidden', message: 'Only editors or owner can create transactions in shared wallets.' });
        }
      }
    }
    const transactionData = {
      ...req.body,
      userId: req.user.uid,
      dateISO: req.body.dateISO ? new Date(req.body.dateISO) : new Date(),
      createdAtISO: req.body.createdAtISO ? new Date(req.body.createdAtISO) : new Date(),
      updatedAtISO: new Date(),
      createdById: req.user.uid,
      createdByName: req.user.name,
      updatedById: req.user.uid,
      updatedByName: req.user.name
    };
    const transaction = new Transaction(transactionData);
    await transaction.save();
    // Only log activity if walletFrom is set (shared wallet)
    if (transaction.walletFrom) {
      (async () => {
        try {
          // Resolve wallet identifier to the wallet's _id when possible so activities
          // are stored against the wallet id (frontend uses wallet.id/_id when filtering)
          let resolvedWalletId = transaction.walletFrom;
          try {
            const found = await Wallet.findOne({ userId: req.user.uid, $or: [{ _id: transaction.walletFrom }, { name: transaction.walletFrom }] });
            if (found) resolvedWalletId = String(found._id);
          } catch (e) {
            // ignore resolution failure and fall back to raw walletFrom value
          }

          const activityData = {
            userId: req.user.uid,
            walletId: resolvedWalletId,
            actorId: req.user.uid,
            actorName: req.user.name,
            action: 'transaction_added',
            entityType: 'transaction',
            entityId: String(transaction._id || transaction.id || ''),
            message: `${req.user.name} created a ${transaction.category || ''} ${transaction.type?.toLowerCase() || ''} (${transaction.amount})`
          };
          console.log('Creating activity (transaction_added):', activityData);
          const activity = new Activity(activityData);
          await activity.save();
          // Trim to last 200 activities for user
          const count = await Activity.countDocuments({ userId: req.user.uid });
          if (count > 200) {
            const oldest = await Activity.find({ userId: req.user.uid })
              .sort({ createdAt: 1 })
              .limit(count - 200)
              .select('_id');
            await Activity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
          }
        } catch (e) {
          console.error('Failed to create activity for transaction create:', e?.message || e);
        }
      })();
    }
    res.status(201).json({ success: true, transaction });
  } catch (err) {
    console.error('Create transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id });
    if (!transaction) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found' });
    }
    // Check permissions
    if (transaction.walletFrom) {
      const wallet = await Wallet.findOne({ name: transaction.walletFrom });
      if (wallet && wallet.plan === 'Shared') {
        const isOwner = wallet.userId === req.user.uid;
        let isEditor = false;
        if (!isOwner && wallet.collaborators) {
          const collab = wallet.collaborators.find(c => c.email === req.user.email);
          isEditor = collab && collab.role === 'Editor';
        }
        if (!isOwner && !isEditor) {
          return res.status(403).json({ error: 'Forbidden', message: 'Only editors or owner can update transactions in shared wallets.' });
        }
      }
    } else if (transaction.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }
    const updateData = {
      ...req.body,
      updatedAtISO: new Date(),
      updatedById: req.user.uid,
      updatedByName: req.user.name
    };
    if (updateData.dateISO) updateData.dateISO = new Date(updateData.dateISO);
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );
    // Only log activity if walletFrom is set (shared wallet)
    if (updatedTransaction.walletFrom) {
      (async () => {
        try {
          let resolvedWalletId = updatedTransaction.walletFrom;
          try {
            const found = await Wallet.findOne({ userId: req.user.uid, $or: [{ _id: updatedTransaction.walletFrom }, { name: updatedTransaction.walletFrom }] });
            if (found) resolvedWalletId = String(found._id);
          } catch (e) {}

          const activityData = {
            userId: req.user.uid,
            walletId: resolvedWalletId,
            actorId: req.user.uid,
            actorName: req.user.name,
            action: 'transaction_updated',
            entityType: 'transaction',
            entityId: String(updatedTransaction._id || updatedTransaction.id || ''),
            message: `${req.user.name} updated a ${updatedTransaction.category || ''} ${updatedTransaction.type?.toLowerCase() || ''} (${updatedTransaction.amount})`
          };
          console.log('Creating activity (transaction_updated):', activityData);
          const activity = new Activity(activityData);
          await activity.save();
          const count = await Activity.countDocuments({ userId: req.user.uid });
          if (count > 200) {
            const oldest = await Activity.find({ userId: req.user.uid })
              .sort({ createdAt: 1 })
              .limit(count - 200)
              .select('_id');
            await Activity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
          }
        } catch (e) {
          console.error('Failed to create activity for transaction update:', e?.message || e);
        }
      })();
    }
    res.json({ success: true, transaction: updatedTransaction });
  } catch (err) {
    console.error('Update transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id });
    if (!transaction) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found' });
    }
    // Check permissions
    if (transaction.walletFrom) {
      const wallet = await Wallet.findOne({ name: transaction.walletFrom });
      if (wallet && wallet.plan === 'Shared') {
        const isOwner = wallet.userId === req.user.uid;
        let isEditor = false;
        if (!isOwner && wallet.collaborators) {
          const collab = wallet.collaborators.find(c => c.email === req.user.email);
          isEditor = collab && collab.role === 'Editor';
        }
        if (!isOwner && !isEditor) {
          return res.status(403).json({ error: 'Forbidden', message: 'Only editors or owner can delete transactions in shared wallets.' });
        }
      }
    } else if (transaction.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }
    await Transaction.findOneAndDelete({ _id: req.params.id });

    // Create activity record for deletion (non-blocking)
    (async () => {
      try {
        let resolvedWalletId = transaction.walletFrom || '';
        try {
          const found = await Wallet.findOne({ userId: req.user.uid, $or: [{ _id: transaction.walletFrom }, { name: transaction.walletFrom }] });
          if (found) resolvedWalletId = String(found._id);
        } catch (e) {}

        const activityData = {
          userId: req.user.uid,
          walletId: resolvedWalletId,
          actorId: req.user.uid,
          actorName: req.user.name,
          action: 'transaction_deleted',
          entityType: 'transaction',
          entityId: String(transaction._id || transaction.id || ''),
          message: `${req.user.name} deleted a ${transaction.category || ''} ${transaction.type?.toLowerCase() || ''} (${transaction.amount})`
        };
        console.log('Creating activity (transaction_deleted):', activityData);
        const activity = new Activity(activityData);
        await activity.save();
        const count = await Activity.countDocuments({ userId: req.user.uid });
        if (count > 200) {
          const oldest = await Activity.find({ userId: req.user.uid })
            .sort({ createdAt: 1 })
            .limit(count - 200)
            .select('_id');
            await Activity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
          }
        } catch (e) {
          console.error('Failed to create activity for transaction delete:', e?.message || e);
        }
      })();
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete transaction' });
  }
});

export default router;

