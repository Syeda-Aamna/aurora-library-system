import { Router } from 'express';
import mongoose from 'mongoose';
import { sampleBooks, sampleMembers } from '../shared/demo-data.js';

const makeId = () => new mongoose.Types.ObjectId().toString();
const now = Date.now();
const books = sampleBooks.map((book) => ({ ...book, _id: makeId(), createdAt: new Date(now), updatedAt: new Date(now) }));
const members = sampleMembers.map((member) => ({ ...member, _id: makeId(), createdAt: new Date(now), updatedAt: new Date(now) }));
const loans = [
  { _id: makeId(), book: books[0]._id, member: members[0]._id, issuedAt: new Date(now - 3 * 86400000), dueAt: new Date(now + 11 * 86400000), returnedAt: null, status: 'issued', isSample: true, createdAt: new Date(now - 3 * 86400000), updatedAt: new Date(now - 3 * 86400000) },
  { _id: makeId(), book: books[1]._id, member: members[1]._id, issuedAt: new Date(now - 9 * 86400000), dueAt: new Date(now - 2 * 86400000), returnedAt: new Date(now - 3 * 86400000), status: 'returned', isSample: true, createdAt: new Date(now - 9 * 86400000), updatedAt: new Date(now - 3 * 86400000) },
];

const isId = (value) => mongoose.isValidObjectId(value);
const text = (value) => typeof value === 'string' ? value.trim() : '';
const validEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
const findBook = (id) => books.find((book) => book._id === String(id));
const findMember = (id) => members.find((member) => member._id === String(id));
const loanView = (loan) => ({
  ...loan,
  book: (() => { const book = findBook(loan.book); return book ? { _id: book._id, title: book.title, author: book.author, isbn: book.isbn } : null; })(),
  member: (() => { const member = findMember(loan.member); return member ? { _id: member._id, name: member.name, email: member.email } : null; })(),
});
const sorted = (rows) => [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const duplicate = (res, label) => res.status(409).json({ error: `That ${label} is already in use.` });

export const demoPublicRouter = Router();
demoPublicRouter.get('/books', (req, res) => {
  const query = text(req.query.search).toLowerCase();
  const result = books.filter((book) => !query || [book.title, book.author, book.category, book.isbn].some((value) => value.toLowerCase().includes(query)));
  res.json(sorted(result).map(({ _id, title, author, category, isbn, publicationYear, availableQuantity, isSample }) => ({ _id, title, author, category, isbn, publicationYear, availableQuantity, isSample })));
});

export const demoAdminRouter = Router();

demoAdminRouter.get('/dashboard', (_req, res) => {
  res.json({
    books: books.length,
    members: members.length,
    issued: loans.filter((loan) => loan.status === 'issued').length,
    returned: loans.filter((loan) => loan.status === 'returned').length,
    available: books.reduce((total, book) => total + book.availableQuantity, 0),
    recent: [...loans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map(loanView),
  });
});

demoAdminRouter.get('/books', (req, res) => {
  const query = text(req.query.search).toLowerCase();
  const result = books.filter((book) => !query || [book.title, book.author, book.category, book.isbn].some((value) => value.toLowerCase().includes(query)));
  res.json(sorted(result));
});

demoAdminRouter.post('/books', (req, res) => {
  const { title, author, category, isbn, publicationYear } = req.body || {};
  const quantity = Number(req.body?.quantity); const year = Number(publicationYear);
  if (![title, author, category, isbn].every((value) => text(value)) || !Number.isInteger(quantity) || quantity < 1 || !Number.isInteger(year) || year < 1000 || year > 2100) {
    return res.status(400).json({ error: 'Enter a title, author, category, ISBN, positive whole-number quantity, and valid publication year.' });
  }
  const cleanIsbn = text(isbn);
  if (books.some((book) => book.isbn.toLowerCase() === cleanIsbn.toLowerCase())) return duplicate(res, 'ISBN');
  const timestamp = new Date();
  const book = { _id: makeId(), title: text(title), author: text(author), category: text(category), isbn: cleanIsbn, quantity, availableQuantity: quantity, publicationYear: year, isSample: false, createdAt: timestamp, updatedAt: timestamp };
  books.unshift(book);
  res.status(201).json(book);
});

demoAdminRouter.patch('/books/:id', (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid book identifier.' });
  const book = findBook(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  for (const key of ['title', 'author', 'category', 'isbn']) {
    if (req.body?.[key] === undefined) continue;
    const value = text(req.body[key]);
    if (!value) return res.status(400).json({ error: `${key[0].toUpperCase()}${key.slice(1)} cannot be empty.` });
    book[key] = value;
  }
  if (books.some((candidate) => candidate._id !== book._id && candidate.isbn.toLowerCase() === book.isbn.toLowerCase())) return duplicate(res, 'ISBN');
  if (req.body?.publicationYear !== undefined) {
    const year = Number(req.body.publicationYear);
    if (!Number.isInteger(year) || year < 1000 || year > 2100) return res.status(400).json({ error: 'Enter a valid publication year.' });
    book.publicationYear = year;
  }
  if (req.body?.quantity !== undefined) {
    const quantity = Number(req.body.quantity); const checkedOut = book.quantity - book.availableQuantity;
    if (!Number.isInteger(quantity) || quantity < Math.max(1, checkedOut)) return res.status(400).json({ error: `Total quantity cannot be less than ${checkedOut} currently checked-out ${checkedOut === 1 ? 'copy' : 'copies'}.` });
    book.availableQuantity += quantity - book.quantity; book.quantity = quantity;
  }
  book.updatedAt = new Date();
  res.json(book);
});

demoAdminRouter.delete('/books/:id', (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid book identifier.' });
  if (loans.some((loan) => loan.book === req.params.id && loan.status === 'issued')) return res.status(409).json({ error: 'This book has an active issue. Mark it returned before deleting the record.' });
  const index = books.findIndex((book) => book._id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Book not found.' });
  books.splice(index, 1); res.json({ ok: true });
});

demoAdminRouter.get('/members', (req, res) => {
  const query = text(req.query.search).toLowerCase();
  const result = members.filter((member) => !query || [member.name, member.email, member.phone].some((value) => value.toLowerCase().includes(query)));
  res.json(sorted(result));
});

demoAdminRouter.post('/members', (req, res) => {
  const { name, email, phone, address } = req.body || {};
  const cleanEmail = text(email).toLowerCase();
  if (![name, email, phone, address].every((value) => text(value)) || !validEmail(cleanEmail)) return res.status(400).json({ error: 'Enter a name, valid email, phone number, and address.' });
  if (members.some((member) => member.email === cleanEmail)) return duplicate(res, 'email address');
  const timestamp = new Date(); const membershipDate = req.body?.membershipDate ? new Date(req.body.membershipDate) : timestamp;
  if (Number.isNaN(membershipDate.getTime())) return res.status(400).json({ error: 'Enter a valid membership date.' });
  const member = { _id: makeId(), name: text(name), email: cleanEmail, phone: text(phone), address: text(address), membershipDate, isSample: false, createdAt: timestamp, updatedAt: timestamp };
  members.unshift(member); res.status(201).json(member);
});

demoAdminRouter.patch('/members/:id', (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid member identifier.' });
  const member = findMember(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found.' });
  for (const key of ['name', 'phone', 'address']) {
    if (req.body?.[key] === undefined) continue;
    const value = text(req.body[key]);
    if (!value) return res.status(400).json({ error: `${key[0].toUpperCase()}${key.slice(1)} cannot be empty.` });
    member[key] = value;
  }
  if (req.body?.email !== undefined) {
    const email = text(req.body.email).toLowerCase();
    if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (members.some((candidate) => candidate._id !== member._id && candidate.email === email)) return duplicate(res, 'email address');
    member.email = email;
  }
  if (req.body?.membershipDate !== undefined) {
    const membershipDate = new Date(req.body.membershipDate);
    if (Number.isNaN(membershipDate.getTime())) return res.status(400).json({ error: 'Enter a valid membership date.' });
    member.membershipDate = membershipDate;
  }
  member.updatedAt = new Date(); res.json(member);
});

demoAdminRouter.delete('/members/:id', (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid member identifier.' });
  if (loans.some((loan) => loan.member === req.params.id && loan.status === 'issued')) return res.status(409).json({ error: 'This member has an active loan. Mark it returned before deleting the member.' });
  const index = members.findIndex((member) => member._id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Member not found.' });
  members.splice(index, 1); res.json({ ok: true });
});

demoAdminRouter.get('/loans', (req, res) => {
  const filter = req.query.status === 'issued' || req.query.status === 'returned' ? req.query.status : '';
  res.json([...loans].filter((loan) => !filter || loan.status === filter).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(loanView));
});

demoAdminRouter.post('/loans', (req, res) => {
  const { bookId, memberId } = req.body || {};
  if (!isId(bookId) || !isId(memberId)) return res.status(400).json({ error: 'Choose a valid book and member.' });
  const book = findBook(bookId); const member = findMember(memberId);
  if (!member) return res.status(404).json({ error: 'Member not found.' });
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  if (book.availableQuantity < 1) return res.status(409).json({ error: 'No copies of that book are currently available.' });
  const dueAt = req.body?.dueAt ? new Date(req.body.dueAt) : new Date(Date.now() + 14 * 86400000);
  if (Number.isNaN(dueAt.getTime())) return res.status(400).json({ error: 'Enter a valid due date.' });
  const timestamp = new Date(); book.availableQuantity -= 1; book.updatedAt = timestamp;
  const loan = { _id: makeId(), book: book._id, member: member._id, issuedAt: timestamp, dueAt, returnedAt: null, status: 'issued', isSample: false, createdAt: timestamp, updatedAt: timestamp };
  loans.unshift(loan); res.status(201).json(loanView(loan));
});

demoAdminRouter.patch('/loans/:id/return', (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid issue identifier.' });
  const loan = loans.find((item) => item._id === req.params.id && item.status === 'issued');
  if (!loan) return res.status(409).json({ error: 'This issue is already returned or no longer exists.' });
  const book = findBook(loan.book);
  if (!book || book.availableQuantity >= book.quantity) return res.status(409).json({ error: 'Inventory could not be reconciled; the return was not recorded.' });
  book.availableQuantity += 1; book.updatedAt = new Date(); loan.status = 'returned'; loan.returnedAt = new Date(); loan.updatedAt = loan.returnedAt;
  res.json(loanView(loan));
});
