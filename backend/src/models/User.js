import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  header: { type: String, default: '' }, 
  showEmail: { type: Boolean, default: false },
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

const User = model('User', UserSchema);

export default User;
