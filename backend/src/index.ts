import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import candidateRoutes from './routes/candidateRoutes';
import screeningRoutes from './routes/screeningRoutes';
import outreachRoutes from './routes/outreachRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth
app.use('/api/auth', authRoutes);

// Admin / recruiter (JWT-protected inside each router)
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/outreach', outreachRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Umurava Lens API running on port ${PORT}`);
  });
};

start().catch(console.error);

export default app;
