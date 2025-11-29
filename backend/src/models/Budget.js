import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CollaboratorSchema = new Schema({
  firebaseUid: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['Owner', 'Editor', 'Viewer'], default: 'Editor' }
}, { _id: false });

const BudgetSchema = new Schema({
  userId: { type: String, required: true, index: true },
  wallet: { type: String, required: true },
  plan: { type: String, required: true, enum: ['Personal', 'Shared'], default: 'Personal' },
  amount: { type: String, required: true },
  left: { type: String, required: true },
  category: { type: String, required: true },
  period: { type: String, required: true, enum: ['Weekly', 'Monthly', 'One-time'], default: 'Monthly' },
  description: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  collaborators: { type: [CollaboratorSchema], default: [] }
}, { timestamps: true });

const Budget = model('Budget', BudgetSchema);

export default Budget;

