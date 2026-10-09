import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  author: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  isbn: { type: String, required: true, trim: true, unique: true, maxlength: 32 },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  availableQuantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  publicationYear: { type: Number, required: true, min: 1000, max: 2100, validate: Number.isInteger },
}, { timestamps: true });

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  membershipDate: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

const loanSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  issuedAt: { type: Date, required: true, default: Date.now },
  dueAt: { type: Date, required: true },
  returnedAt: { type: Date, default: null },
  status: { type: String, enum: ['issued', 'returned'], default: 'issued', index: true },
}, { timestamps: true });
loanSchema.index({ status: 1, issuedAt: -1 });

export const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);
export const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);
export const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);
