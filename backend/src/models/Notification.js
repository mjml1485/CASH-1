import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true }, // firebaseUid of the user receiving the notification
  type: { 
    type: String, 
    required: true,
    enum: ['follow', 'follow_back'] // follow: someone followed you, follow_back: someone you follow followed you back
  },
  actorId: { type: String, required: true }, // firebaseUid of the user who performed the action
  actorName: { type: String, required: true }, // Name of the user who performed the action
  actorUsername: { type: String, required: true }, // Username of the user who performed the action
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });

const Notification = model('Notification', NotificationSchema);

export default Notification;

