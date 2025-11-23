import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    console.error('MONGO_URI is not set. Skipping MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.info('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err?.message || err);
    process.exit(1);
  }
}

export default connectDB;
