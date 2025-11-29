import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSettingsSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  currency: { type: String, default: 'PHP' },
  // Map of walletId -> boolean (true = visible, false = hidden)
  balanceVisibility: { type: Map, of: Boolean, default: {} },
  // Add other settings here as needed
}, { timestamps: true });

const UserSettings = model('UserSettings', UserSettingsSchema);

export default UserSettings;

