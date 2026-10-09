import { Router } from 'express';
import { Book } from './models.js';

const router = Router();
router.get('/books', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const filter = search ? { $or: ['title', 'author', 'category'].map((key) => ({ [key]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })) } : {};
  const books = await Book.find(filter, 'title author category isbn publicationYear availableQuantity').sort({ title: 1 }).lean();
  res.json(books);
});

export default router;
