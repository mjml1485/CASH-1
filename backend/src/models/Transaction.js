import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const TransactionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['Income', 'Expense', 'Transfer'] },
  amount: { type: String, required: true },
  dateISO: { type: Date, required: true },
  category: { type: String, required: true },
  walletFrom: { type: String, required: true },
  walletTo: { type: String },
  description: { type: String, default: '' },
  createdById: { type: String },
  createdByName: { type: String },
  createdAtISO: { type: Date },
  updatedById: { type: String },
  updatedByName: { type: String },
  updatedAtISO: { type: Date }
}, { timestamps: true });

const Transaction = model('Transaction', TransactionSchema);

export default Transaction;

