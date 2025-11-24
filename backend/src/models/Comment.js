import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CommentSchema = new Schema({
  userId: { type: String, required: true, index: true },
  walletId: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const Comment = model('Comment', CommentSchema);

export default Comment;

