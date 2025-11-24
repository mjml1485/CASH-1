import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ActivitySchema = new Schema({
  userId: { type: String, required: true, index: true },
  walletId: { type: String, required: true, index: true },
  actorId: { type: String, required: true },
  actorName: { type: String, required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'transaction_added',
      'transaction_updated',
      'transaction_deleted',
      'budget_added',
      'budget_updated',
      'budget_deleted',
      'member_added',
      'member_removed',
      'comment_added',
      'system_message'
    ]
  },
  entityType: { 
    type: String, 
    required: true,
    enum: ['wallet', 'budget', 'transaction', 'member', 'comment', 'system']
  },
  entityId: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const Activity = model('Activity', ActivitySchema);

export default Activity;

