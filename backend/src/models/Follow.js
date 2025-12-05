import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const FollowSchema = new Schema({
  followerId: { type: String, required: true, index: true }, // firebaseUid of the user who follows
  followingId: { type: String, required: true, index: true }, // firebaseUid of the user being followed
}, { timestamps: true });

// Ensure unique follow relationships
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = model('Follow', FollowSchema);

export default Follow;

