import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import authRoutes from './routes/auth';
import citiesRoutes from './routes/cities';
import emailRoutes from './routes/email';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
initializeFirebase();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Ensure https:// prefix for production URLs
  const normalizedUrl = frontendUrl.startsWith('http')
    ? frontendUrl
    : `https://${frontendUrl}`;
  return [
    normalizedUrl,
    'http://localhost:5173',
    'https://travel-globe-ten.vercel.app',
    'https://mytravelglobe.org',
    'https://www.mytravelglobe.org',
  ];
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
}));

// Parse JSON for most routes
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/email', emailRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
