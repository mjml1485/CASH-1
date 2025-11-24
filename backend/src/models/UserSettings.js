import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSettingsSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  currency: { type: String, default: 'PHP' },
  // Add other settings here as needed
}, { timestamps: true });

const UserSettings = model('UserSettings', UserSettingsSchema);

export default UserSettings;

