import { Router } from 'express';
import asyncRoute from './async-route.js';
import { Book } from './models.js';

const router = Router();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/books', asyncRoute(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const filter = search
    ? { $or: ['title', 'author', 'category', 'isbn'].map((key) => ({ [key]: { $regex: escapeRegex(search), $options: 'i' } })) }
    : {};
  const books = await Book.find(filter, 'title author category isbn publicationYear quantity availableQuantity')
    .sort({ title: 1 })
    .lean();
  res.json(books.map((book) => ({
    ...book,
    coverUrl: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-M.jpg?default=false`,
    sourceUrl: `https://openlibrary.org/isbn/${encodeURIComponent(book.isbn)}`,
  })));
}));

export default router;
