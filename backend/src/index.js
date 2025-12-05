import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import walletsRoutes from './routes/wallets.js';
import budgetsRoutes from './routes/budgets.js';
import transactionsRoutes from './routes/transactions.js';
// activities route removed
import commentsRoutes from './routes/comments.js';
import customCategoriesRoutes from './routes/customCategories.js';
import settingsRoutes from './routes/settings.js';
import notificationsRoutes from './routes/notifications.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CASH API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/transactions', transactionsRoutes);
// activities route removed
app.use('/api/comments', commentsRoutes);
app.use('/api/custom-categories', customCategoriesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err?.message || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`CASH Backend API running on http://localhost:${PORT}`);
});

