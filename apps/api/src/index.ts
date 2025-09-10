import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './utils/database';
import { errorHandler } from './middleware/errorHandler';
import uploadRoutes from './routes/upload';
import extractRoutes from './routes/extract';
import invoiceRoutes from './routes/invoices';

// Load environment variables from local and monorepo root (fallbacks)
dotenv.config(); // apps/api/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../..', '.env') }); // monorepo root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // fallback for tsx runtime pathing

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Flowbit API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api/invoices', invoiceRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Flowbit API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
