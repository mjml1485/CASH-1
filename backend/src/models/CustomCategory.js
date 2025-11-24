import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CustomCategorySchema = new Schema({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true }
}, { timestamps: true });

CustomCategorySchema.index({ userId: 1, category: 1 }, { unique: true });

const CustomCategory = model('CustomCategory', CustomCategorySchema);

export default CustomCategory;

