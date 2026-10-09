import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './routes.js';
import authRouter, { requireAdmin } from './auth.js';
import publicRouter from './public.js';
import { Book, Member, Loan, LibrarySetting } from './models.js';
import { sampleBooks, sampleMembers } from '../shared/demo-data.js';
import { demoAdminRouter, demoPublicRouter } from './demo-store.js';
import { isPreviewDemoMode } from './runtime.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const demoMode = isPreviewDemoMode();

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

const demoSeedKey = 'aurora-fictional-demo-data-v1';
let demoSeedPromise;
async function upsertSample(Model, field, value, data) {
  const filter = { [field]: value };
  try {
    return await Model.findOneAndUpdate(filter, { $setOnInsert: data }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await Model.findOne(filter);
    if (existing) return existing;
    throw error;
  }
}
async function markDemoSeed(value) {
  try { await LibrarySetting.updateOne({ key: demoSeedKey }, { $setOnInsert: { key: demoSeedKey, value } }, { upsert: true }); }
  catch (error) { if (error.code !== 11000) throw error; }
}
async function seedDemoData() {
  if (process.env.SEED_DEMO_DATA === 'false' || await LibrarySetting.exists({ key: demoSeedKey })) return;
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
      const [bookCount, memberCount, loanCount] = await Promise.all([Book.estimatedDocumentCount(), Member.estimatedDocumentCount(), Loan.estimatedDocumentCount()]);
      if (bookCount || memberCount || loanCount) {
        await markDemoSeed('skipped-existing-library');
        return;
      }
      const [books, members] = await Promise.all([
        Promise.all(sampleBooks.map((data) => upsertSample(Book, 'isbn', data.isbn, data))),
        Promise.all(sampleMembers.map((data) => upsertSample(Member, 'email', data.email, data))),
      ]);
      const now = Date.now();
      await Promise.all([
        upsertSample(Loan, 'demoKey', 'aurora-demo-active-issue', { demoKey: 'aurora-demo-active-issue', book: books[0]._id, member: members[0]._id, issuedAt: new Date(now - 3 * 86400000), dueAt: new Date(now + 11 * 86400000), status: 'issued', isSample: true }),
        upsertSample(Loan, 'demoKey', 'aurora-demo-returned-issue', { demoKey: 'aurora-demo-returned-issue', book: books[1]._id, member: members[1]._id, issuedAt: new Date(now - 9 * 86400000), dueAt: new Date(now - 2 * 86400000), returnedAt: new Date(now - 3 * 86400000), status: 'returned', isSample: true }),
      ]);
      await markDemoSeed('fictional-sample-records-created');
    })().catch((error) => { demoSeedPromise = undefined; throw error; });
  }
  await demoSeedPromise;
}

let connectionPromise;
async function connectDatabase() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw Object.assign(new Error('Database is not configured. Add MONGODB_URI to the server environment.'), { status: 503 });
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
        .catch((error) => { connectionPromise = undefined; throw error; });
    }
    await connectionPromise;
  }
  await seedDemoData();
}
const database = async (_req, _res, next) => {
  try { await connectDatabase(); next(); } catch (error) { next(error); }
};

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  service: 'aurora-library-api',
  demoMode,
  databaseConfigured: Boolean(process.env.MONGODB_URI),
  adminConfigured: Boolean(
    String(process.env.SESSION_SECRET || '').length >= 32 &&
    String(process.env.ADMIN_EMAIL || '').trim() &&
    process.env.ADMIN_PASSWORD,
  ),
}));
app.use('/api/auth', authRouter);
if (demoMode) {
  app.use('/api/public', demoPublicRouter);
  app.use('/api', requireAdmin, demoAdminRouter);
} else {
  app.use('/api/public', database, publicRouter);
  app.use('/api', requireAdmin, database, router);
}
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((error, _req, res, _next) => {
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'That ISBN or email address is already in use.' : status === 500 ? 'The server could not complete that request.' : error.message;
  if (status === 500) console.error(error);
  res.status(status).json({ error: message });
});

export default app;
