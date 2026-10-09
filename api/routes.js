import { Router } from 'express';
import mongoose from 'mongoose';
import asyncRoute from './async-route.js';
import { Book, Member, Loan } from './models.js';

const router = Router();
const text = (value) => typeof value === 'string' ? value.trim() : '';
const validId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/dashboard', asyncRoute(async (_req, res) => {
  const [titles, members, activeLoans, returnedLoans, inventory] = await Promise.all([
    Book.countDocuments(), Member.countDocuments(), Loan.countDocuments({ status: 'issued' }),
    Loan.countDocuments({ status: 'returned' }),
    Book.aggregate([{ $group: { _id: null, books: { $sum: '$quantity' }, available: { $sum: '$availableQuantity' } } }]),
  ]);
  const recent = await Loan.find().sort({ createdAt: -1 }).limit(6).populate('book', 'title author').populate('member', 'name');
  res.json({ books: inventory[0]?.books || 0, titles, members, issued: activeLoans, returned: returnedLoans, available: inventory[0]?.available || 0, recent });
}));

router.get('/books', asyncRoute(async (req, res) => {
  const q = text(req.query.search);
  const filter = q ? { $or: ['title', 'author', 'category', 'isbn'].map((key) => ({ [key]: new RegExp(escapeRegex(q), 'i') })) } : {};
  res.json(await Book.find(filter).sort({ createdAt: -1 }).lean());
}));
router.post('/books', asyncRoute(async (req, res) => {
  const { title, author, category, isbn, publicationYear } = req.body || {};
  const quantity = Number(req.body?.quantity);
  if (![title, author, category, isbn].every((value) => text(value)) || !Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(Number(publicationYear))) {
    return res.status(400).json({ error: 'Enter a title, author, category, ISBN, non-negative whole-number quantity, and valid publication year.' });
  }
  const book = await Book.create({ title: text(title), author: text(author), category: text(category), isbn: text(isbn), quantity, availableQuantity: quantity, publicationYear: Number(publicationYear) });
  res.status(201).json(book);
}));
router.patch('/books/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid book identifier.' });
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  const { title, author, category, isbn, publicationYear } = req.body || {};
  if (title !== undefined) book.title = text(title);
  if (author !== undefined) book.author = text(author);
  if (category !== undefined) book.category = text(category);
  if (isbn !== undefined) book.isbn = text(isbn);
  if (publicationYear !== undefined) book.publicationYear = Number(publicationYear);
  if (req.body?.quantity !== undefined) {
    const quantity = Number(req.body.quantity);
    const checkedOut = book.quantity - book.availableQuantity;
    if (!Number.isInteger(quantity) || quantity < Math.max(0, checkedOut)) {
      return res.status(400).json({ error: `Total quantity cannot be less than ${checkedOut} currently checked-out ${checkedOut === 1 ? 'copy' : 'copies'}.` });
    }
    book.availableQuantity += quantity - book.quantity;
    book.quantity = quantity;
  }
  await book.save();
  res.json(book);
}));
router.delete('/books/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid book identifier.' });
  if (await Loan.exists({ book: req.params.id, status: 'issued' })) return res.status(409).json({ error: 'This book has an active issue. Mark it returned before deleting the record.' });
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  res.json({ ok: true });
}));

router.get('/members', asyncRoute(async (req, res) => {
  const q = text(req.query.search);
  const filter = q ? { $or: ['name', 'email', 'phone'].map((key) => ({ [key]: new RegExp(escapeRegex(q), 'i') })) } : {};
  res.json(await Member.find(filter).sort({ createdAt: -1 }).lean());
}));
router.post('/members', asyncRoute(async (req, res) => {
  const { name, email, phone, address } = req.body || {};
  if (![name, email, phone, address].every((value) => text(value)) || !/^\S+@\S+\.\S+$/.test(text(email))) {
    return res.status(400).json({ error: 'Enter a name, valid email, phone number, and address.' });
  }
  const member = await Member.create({ name: text(name), email: text(email).toLowerCase(), phone: text(phone), address: text(address), membershipDate: req.body?.membershipDate || new Date() });
  res.status(201).json(member);
}));
router.patch('/members/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid member identifier.' });
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found.' });
  for (const key of ['name', 'phone', 'address']) if (req.body?.[key] !== undefined) member[key] = text(req.body[key]);
  if (req.body?.email !== undefined) {
    const email = text(req.body.email).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    member.email = email;
  }
  if (req.body?.membershipDate !== undefined) member.membershipDate = req.body.membershipDate;
  await member.save();
  res.json(member);
}));
router.delete('/members/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid member identifier.' });
  if (await Loan.exists({ member: req.params.id, status: 'issued' })) return res.status(409).json({ error: 'This member has an active loan. Mark it returned before deleting the member.' });
  const member = await Member.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found.' });
  res.json({ ok: true });
}));

router.get('/loans', asyncRoute(async (req, res) => {
  const filter = req.query.status === 'issued' || req.query.status === 'returned' ? { status: req.query.status } : {};
  res.json(await Loan.find(filter).sort({ createdAt: -1 }).populate('book', 'title author isbn').populate('member', 'name email').lean());
}));
router.post('/loans', asyncRoute(async (req, res) => {
  const { bookId, memberId } = req.body || {};
  if (!validId(bookId) || !validId(memberId)) return res.status(400).json({ error: 'Choose a valid book and member.' });
  const member = await Member.findById(memberId);
  if (!member) return res.status(404).json({ error: 'Member not found.' });
  const book = await Book.findOneAndUpdate({ _id: bookId, availableQuantity: { $gt: 0 } }, { $inc: { availableQuantity: -1 } }, { new: true });
  if (!book) return res.status(409).json({ error: 'No copies of that book are currently available.' });
  try {
    const dueAt = req.body?.dueAt ? new Date(req.body.dueAt) : new Date(Date.now() + 14 * 86400000);
    if (Number.isNaN(dueAt.getTime())) throw Object.assign(new Error('Enter a valid due date.'), { status: 400 });
    const loan = await Loan.create({ book: bookId, member: memberId, dueAt });
    await loan.populate(['book', 'member']);
    res.status(201).json(loan);
  } catch (error) {
    await Book.updateOne({ _id: bookId }, { $inc: { availableQuantity: 1 } });
    throw error;
  }
}));
router.patch('/loans/:id/return', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid issue identifier.' });
  const loan = await Loan.findOneAndUpdate({ _id: req.params.id, status: 'issued' }, { $set: { status: 'returned', returnedAt: new Date() } }, { new: true }).populate('book', 'title').populate('member', 'name');
  if (!loan) return res.status(409).json({ error: 'This issue is already returned or no longer exists.' });
  const inventoryUpdate = await Book.updateOne({ _id: loan.book._id, $expr: { $lt: ['$availableQuantity', '$quantity'] } }, { $inc: { availableQuantity: 1 } });
  if (!inventoryUpdate.modifiedCount) {
    await Loan.updateOne({ _id: loan._id, status: 'returned' }, { $set: { status: 'issued', returnedAt: null } });
    return res.status(409).json({ error: 'Inventory could not be reconciled; the return was not recorded.' });
  }
  res.json(loan);
}));

export default router;
