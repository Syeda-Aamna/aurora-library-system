import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

let connectionPromise;
async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw Object.assign(new Error('Database is not configured. Add MONGODB_URI to the server environment.'), { status: 503 });
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((error) => { connectionPromise = undefined; throw error; });
  }
  await connectionPromise;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'aurora-library-api' }));
app.use('/api', async (req, res, next) => {
  try { await connectDatabase(); next(); } catch (error) { next(error); }
}, router);
app.use((error, _req, res, _next) => {
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'That ISBN or email address is already in use.' : status === 500 ? 'The server could not complete that request.' : error.message;
  if (status === 500) console.error(error);
  res.status(status).json({ error: message });
});

export default app;
