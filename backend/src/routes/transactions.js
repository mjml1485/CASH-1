import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Activity from '../models/Activity.js';
import Wallet from '../models/Wallet.js';

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
    const updateData = {
      ...req.body,
      updatedAtISO: new Date(),
      updatedById: req.user.uid,
      updatedByName: req.user.name
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
    // Only log activity if walletFrom is set (shared wallet)
    if (transaction.walletFrom) {
      (async () => {
        try {
          let resolvedWalletId = transaction.walletFrom;
          try {
            const found = await Wallet.findOne({ userId: req.user.uid, $or: [{ _id: transaction.walletFrom }, { name: transaction.walletFrom }] });
            if (found) resolvedWalletId = String(found._id);
          } catch (e) {}

          const activityData = {
            userId: req.user.uid,
            walletId: resolvedWalletId,
            actorId: req.user.uid,
            actorName: req.user.name,
            action: 'transaction_updated',
            entityType: 'transaction',
            entityId: String(transaction._id || transaction.id || ''),
            message: `${req.user.name} updated a ${transaction.category || ''} ${transaction.type?.toLowerCase() || ''} (${transaction.amount})`
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

