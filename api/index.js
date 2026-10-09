import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './routes.js';
import authRouter, { requireAdmin } from './auth.js';
import publicRouter from './public.js';
import { Book, Member, Loan, LibrarySetting } from './models.js';
import { starterCatalog } from '../shared/catalog-data.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Vercel routes /api/* to this one function; restore the requested Express path.
app.use((req, _res, next) => {
  if (req.path === '/api/index.js' && typeof req.query.__route === 'string') {
    const route = req.query.__route.replace(/^\/+/, '');
    const query = new URLSearchParams(req.query);
    query.delete('__route');
    req.url = `/api/${route}${query.size ? `?${query.toString()}` : ''}`;
  }
  next();
});

const seedKey = 'verified-starter-catalog-v1';
let seedPromise;
async function seedStarterCatalog() {
  if (process.env.SEED_STARTER_CATALOG === 'false' || !starterCatalog.length) return;
  if (await LibrarySetting.exists({ key: seedKey })) return;
  const [bookCount, memberCount, loanCount] = await Promise.all([
    Book.estimatedDocumentCount(), Member.estimatedDocumentCount(), Loan.estimatedDocumentCount(),
  ]);
  if (bookCount || memberCount || loanCount) {
    await LibrarySetting.updateOne(
      { key: seedKey },
      { $setOnInsert: { key: seedKey, value: 'skipped-existing-library-data' } },
      { upsert: true },
    );
    return;
  }
  if (!seedPromise) {
    seedPromise = (async () => {
      const claim = await LibrarySetting.updateOne(
        { key: seedKey },
        { $setOnInsert: { key: seedKey, value: 'seeding' } },
        { upsert: true },
      );
      if (!claim.upsertedCount) return;
      try {
        await Promise.all(starterCatalog.map(async (book) => {
          try {
            await Book.updateOne(
              { isbn: book.isbn },
              { $setOnInsert: book },
              { upsert: true, setDefaultsOnInsert: true, runValidators: true },
            );
          } catch (error) {
            if (error.code !== 11000) throw error;
          }
        }));
        await LibrarySetting.updateOne({ key: seedKey }, { $set: { value: 'seeded-real-zero-stock-catalog' } });
      } catch (error) {
        await LibrarySetting.deleteOne({ key: seedKey });
        throw error;
      }
    })().catch((error) => { seedPromise = undefined; throw error; });
  }
  await seedPromise;
}

let connectionPromise;
async function connectDatabase() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw Object.assign(new Error('Database is not configured. Add MONGODB_URI to the server environment.'), { status: 503 });
    }
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
        .catch((error) => { connectionPromise = undefined; throw error; });
    }
    await connectionPromise;
  }
  await seedStarterCatalog();
}
const database = async (_req, _res, next) => {
  try { await connectDatabase(); next(); } catch (error) { next(error); }
};

const adminConfigured = () => Boolean(
  String(process.env.SESSION_SECRET || '').length >= 32 &&
  String(process.env.ADMIN_EMAIL || '').trim() &&
  process.env.ADMIN_PASSWORD,
);
app.get('/api/health', async (_req, res) => {
  const databaseConfigured = Boolean(process.env.MONGODB_URI);
  if (!databaseConfigured) {
    return res.json({ ok: false, service: 'library-desk-api', databaseConfigured: false, databaseConnected: false, adminConfigured: adminConfigured(), ready: false });
  }
  try {
    await connectDatabase();
    const databaseConnected = mongoose.connection.readyState === 1;
    const adminReady = adminConfigured();
    res.json({ ok: databaseConnected, service: 'library-desk-api', databaseConfigured: true, databaseConnected, adminConfigured: adminReady, ready: databaseConnected && adminReady });
  } catch {
    res.json({ ok: false, service: 'library-desk-api', databaseConfigured: true, databaseConnected: false, adminConfigured: adminConfigured(), ready: false });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/public', database, publicRouter);
app.use('/api', requireAdmin, database, router);
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((error, _req, res, _next) => {
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'That ISBN or email address is already in use.' : status === 500 ? 'The server could not complete that request.' : error.message;
  if (status === 500) console.error(error);
  res.status(status).json({ error: message });
});

export default app;
