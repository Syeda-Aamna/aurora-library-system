import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import EntryFlow from './EntryFlow.jsx';
import {
  Activity, AlertCircle, ArrowDownLeft, ArrowRight, ArrowUpRight, BookMarked,
  BookOpen, Check, CheckCircle2, ChevronDown, Clock3, Command, FileText,
  LayoutDashboard, LibraryBig, LoaderCircle, LogOut, Menu, Plus, Search,
  SlidersHorizontal, Sparkles, Users, X, CalendarDays, Trash2, Pencil,
} from 'lucide-react';

const api = axios.create({ baseURL: '/api' });
const fmtDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '·';
const errorText = (error) => error.response?.data?.error || (error.code === 'ERR_NETWORK' ? 'Could not reach the library API. Check the server and MongoDB connection.' : 'Something went wrong. Please try again.');

const menu = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'books', label: 'Book collection', icon: BookOpen },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'circulation', label: 'Circulation', icon: ArrowDownLeft },
];

function AdminDashboard({ onLogout }) {
  const [page, setPage] = useState('overview');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [b, m, l, d] = await Promise.all([
        api.get('/books'), api.get('/members'), api.get('/loans'), api.get('/dashboard'),
      ]);
      setBooks(b.data); setMembers(m.data); setLoans(l.data); setDashboard(d.data); setError('');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredBooks = useMemo(() => books.filter((b) => [b.title, b.author, b.category, b.isbn].some((v) => v?.toLowerCase().includes(search.toLowerCase()))), [books, search]);
  const filteredMembers = useMemo(() => members.filter((m) => [m.name, m.email, m.phone].some((v) => v?.toLowerCase().includes(search.toLowerCase()))), [members, search]);
  const filteredLoans = useMemo(() => loans.filter((l) => [l.book?.title, l.member?.name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))), [loans, search]);

  async function submitDialog(event) {
    event.preventDefault(); setSaving(true); setError('');
    const { type, record } = dialog;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (type === 'book') {
        if (record) await api.patch(`/books/${record._id}`, values); else await api.post('/books', values);
        setNotice(record ? 'Book details updated.' : 'Book added to the collection.');
      } else if (type === 'member') {
        if (record) await api.patch(`/members/${record._id}`, values); else await api.post('/members', values);
        setNotice(record ? 'Member profile updated.' : 'Member added to the register.');
      } else {
        await api.post('/loans', values); setNotice('Book issued successfully.');
      }
      setDialog(null); await load();
    } catch (e) { setError(errorText(e)); }
    finally { setSaving(false); }
  }

  async function removeRecord(kind, record) {
    if (!window.confirm(`Remove ${kind === 'books' ? `“${record.title}”` : record.name} from the register?`)) return;
    try { await api.delete(`/${kind}/${record._id}`); setNotice(kind === 'books' ? 'Book removed.' : 'Member removed.'); await load(); }
    catch (e) { setError(errorText(e)); }
  }

  async function returnLoan(loan) {
    try { await api.patch(`/loans/${loan._id}/return`); setNotice(`“${loan.book?.title || 'Book'}” marked as returned.`); await load(); }
    catch (e) { setError(errorText(e)); }
  }

  const activePage = menu.find((item) => item.id === page) || menu[0];
  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><div className="brand-mark"><img className="brand-logo" src="/aurora-logo.png" alt="Aurora Store" /></div><div><strong>Aurora Store</strong><span>LIBRARY DESK</span></div><button className="mobile-close icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="side-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {menu.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'nav-active' : ''}`} onClick={() => { setPage(id); setSearch(''); setMobileOpen(false); }}><Icon size={18} strokeWidth={1.75} /><span>{label}</span>{id === 'circulation' && dashboard?.issued > 0 && <small>{dashboard.issued}</small>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="side-rule" />
        <div className="reading-note"><Sparkles size={15} /><span>“Every page opens a door.”</span><small>THE LIBRARY MOTTO</small></div>
        <div className="profile-row"><div className="avatar librarian-avatar">AL</div><div className="profile-copy"><strong>Library Admin</strong><span>Librarian</span></div><button className="icon-btn logout-btn" title="Sign out" aria-label="Sign out" onClick={onLogout}><LogOut size={16} /></button></div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar"><div className="top-left"><button className="mobile-menu icon-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="crumb"><span>LIBRARY</span><span className="crumb-slash">/</span><strong>{activePage.label.toUpperCase()}</strong></div></div><div className="top-right"><span className="today-date"><CalendarDays size={15} />{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="top-separator" /><div className="status-online"><i /> DESK OPEN</div></div></header>
        <div className="page-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{page === 'overview' ? 'YOUR LIBRARY, AT A GLANCE' : page === 'books' ? 'THE COLLECTION' : page === 'members' ? 'YOUR READING COMMUNITY' : 'LENDING REGISTER'}</div><h1>{page === 'overview' ? 'Good morning, librarian.' : page === 'books' ? 'Book collection' : page === 'members' ? 'Library members' : 'Circulation desk'} <span className="heading-period">.</span></h1><p className="page-subtitle">{page === 'overview' ? 'A little order, a lot of possibility. Here’s the day at Aurora.' : page === 'books' ? 'Every title on your shelves, thoughtfully accounted for.' : page === 'members' ? 'The curious minds who make this library a community.' : 'Keep each book moving from one reader to the next.'}</p></div>
            <div className="heading-actions">{page === 'books' && <button className="btn-primary" onClick={() => setDialog({ type: 'book' })}><Plus size={17} /> Add a book</button>}{page === 'members' && <button className="btn-primary" onClick={() => setDialog({ type: 'member' })}><Plus size={17} /> Add a member</button>}{page === 'circulation' && <button className="btn-primary" onClick={() => setDialog({ type: 'loan' })}><ArrowUpRight size={17} /> Issue a book</button>}</div>
          </div>

          {error && <div className="alert-error"><AlertCircle size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
          {busy && <div className="loading-bar"><LoaderCircle size={16} className="spin" /> Connecting to the library register…</div>}

          {page === 'overview' && <Overview dashboard={dashboard} books={books} onNavigate={setPage} onIssue={() => setDialog({ type: 'loan' })} />}
          {page === 'books' && <BooksPage books={filteredBooks} search={search} setSearch={setSearch} onAdd={() => setDialog({ type: 'book' })} onEdit={(record) => setDialog({ type: 'book', record })} onDelete={(record) => removeRecord('books', record)} />}
          {page === 'members' && <MembersPage members={filteredMembers} search={search} setSearch={setSearch} onAdd={() => setDialog({ type: 'member' })} onEdit={(record) => setDialog({ type: 'member', record })} onDelete={(record) => removeRecord('members', record)} />}
          {page === 'circulation' && <CirculationPage loans={filteredLoans} search={search} setSearch={setSearch} onIssue={() => setDialog({ type: 'loan' })} onReturn={returnLoan} />}
          {notice && <div className="toast"><span className="toast-check"><Check size={14} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
        </div>
        <footer className="main-footer"><span>AURORA LIBRARY <i>·</i> READ. DREAM. LEARN. GROW.</span><span>EST. 2026</span></footer>
      </main>
      {dialog && <RecordDialog dialog={dialog} books={books} members={members} onClose={() => setDialog(null)} onSubmit={submitDialog} saving={saving} />}
    </div>
  );
}

function Overview({ dashboard, books, onNavigate, onIssue }) {
  const metricCards = [
    { label: 'BOOK TITLES', value: dashboard?.books ?? '—', icon: BookOpen, detail: 'IN THE COLLECTION', color: 'gold' },
    { label: 'MEMBERS', value: dashboard?.members ?? '—', icon: Users, detail: 'ACTIVE READERS', color: 'sage' },
    { label: 'ON LOAN', value: dashboard?.issued ?? '—', icon: ArrowUpRight, detail: 'CURRENTLY ISSUED', color: 'blue' },
    { label: 'AVAILABLE COPIES', value: dashboard?.available ?? '—', icon: CheckCircle2, detail: 'READY TO BORROW', color: 'cream' },
  ];
  const latest = dashboard?.recent || [];
  const stockBooks = [...books].sort((a, b) => (a.availableQuantity / Math.max(a.quantity, 1)) - (b.availableQuantity / Math.max(b.quantity, 1))).slice(0, 4);
  return <>
    <div className="metrics-grid">{metricCards.map(({ label, value, icon: Icon, detail, color }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><div className={`metric-icon ${color}`}><Icon size={17} /></div></div><div className="metric-value">{value}</div><div className="metric-detail"><span className="metric-pip" />{detail}</div></article>)}</div>
    {books.some((book) => book.isSample) && <div className="sample-notice"><Sparkles size={17} /><span><strong>Fictional demo library loaded.</strong> Try adding a book, issuing a copy, or returning the active sample loan. Sample records are labeled and can be removed.</span></div>}
    <div className="overview-grid">
      <section className="panel recent-panel"><div className="panel-heading"><div><span className="panel-kicker">THE LATEST MOVEMENT</span><h2>Recent circulation</h2></div><button className="text-link" onClick={() => onNavigate('circulation')}>All activity <ArrowRight size={14} /></button></div>
        {latest.length ? <div className="recent-list">{latest.map((loan) => <div className="recent-row" key={loan._id}><div className={`recent-icon ${loan.status === 'returned' ? 'recent-return' : ''}`}>{loan.status === 'returned' ? <ArrowDownLeft size={17} /> : <BookOpen size={17} />}</div><div className="recent-copy"><strong>{loan.book?.title || 'Book removed'}</strong><span>{loan.status === 'returned' ? 'Returned by ' : 'Issued to '}{loan.member?.name || 'Member'}</span></div><div className="recent-meta"><span className={`status-pill ${loan.status === 'issued' ? 'status-issued' : 'status-returned'}`}>{loan.status}</span><time>{fmtDate(loan.returnedAt || loan.issuedAt)}</time></div></div>)}</div> : <EmptyState title="A quiet lending desk" text="Once you issue the first book, its journey will show up here." action="Issue a book" onClick={onIssue} />}
      </section>
      <section className="panel stock-panel"><div className="panel-heading"><div><span className="panel-kicker">SHELF CHECK</span><h2>Low on the shelf</h2></div><button className="icon-link" onClick={() => onNavigate('books')} aria-label="See all books"><ArrowRight size={17} /></button></div>
        {stockBooks.length ? <div className="stock-list">{stockBooks.map((book) => { const pct = Math.round((book.availableQuantity / Math.max(book.quantity, 1)) * 100); return <div className="stock-row" key={book._id}><div className="mini-cover"><BookOpen size={17} /></div><div className="stock-info"><div className="stock-title"><strong>{book.title}</strong><span>{book.availableQuantity} / {book.quantity}</span></div><div className="stock-track"><span style={{ width: `${pct}%` }} /></div><small>{book.author}</small></div></div>; })}</div> : <EmptyState title="Room to fill the shelves" text="Add books to see collection availability." action="View collection" onClick={() => onNavigate('books')} />}
      </section>
    </div>
    <section className="desk-banner"><div className="banner-mark"><LibraryBig size={25} /></div><div className="banner-copy"><span>THE LIBRARY, IN MOTION</span><strong>Every book has another story to find.</strong></div><button onClick={onIssue}>Start a new issue <ArrowRight size={15} /></button><div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /></section>
  </>;
}

function Toolbar({ search, setSearch, placeholder, children }) {
  return <div className="table-toolbar"><label className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} /><kbd>⌘ K</kbd></label><button className="filter-button" onClick={() => setSearch('')}><SlidersHorizontal size={16} /> Clear</button>{children}</div>;
}

function BooksPage({ books, search, setSearch, onAdd, onEdit, onDelete }) {
  return <section className="panel data-panel"><Toolbar search={search} setSearch={setSearch} placeholder="Search by title, author, ISBN…" /><div className="data-table-wrap"><table><thead><tr><th>BOOK / TITLE</th><th>AUTHOR</th><th>CATEGORY</th><th>ISBN</th><th>YEAR</th><th>IN / AVAILABLE</th><th></th></tr></thead><tbody>{books.map((book, index) => <tr key={book._id}><td><div className="book-cell"><div className={`book-cover cover-${index % 4}`}><BookOpen size={16} /></div><strong>{book.title}</strong>{book.isSample && <span className="sample-chip">SAMPLE</span>}</div></td><td>{book.author}</td><td><span className="category-tag">{book.category}</span></td><td className="mono-cell">{book.isbn}</td><td>{book.publicationYear}</td><td><div className="quantity-cell"><strong>{book.availableQuantity}</strong><span>/ {book.quantity}</span></div></td><td><RowActions onEdit={() => onEdit(book)} onDelete={() => onDelete(book)} /></td></tr>)}</tbody></table>{!books.length && <EmptyState title="No books in this view" text={search ? 'Try a different search, or clear the filter.' : 'Your collection is waiting for its first title.'} action="Add a book" onClick={onAdd} />}</div><div className="table-foot"><span>SHOWING <b>{books.length}</b> TITLES</span><span>INVENTORY IS UPDATED WITH EACH ISSUE & RETURN</span></div></section>;
}

function MembersPage({ members, search, setSearch, onAdd, onEdit, onDelete }) {
  return <section className="panel data-panel"><Toolbar search={search} setSearch={setSearch} placeholder="Search name, email, or phone…" /><div className="data-table-wrap"><table><thead><tr><th>MEMBER</th><th>EMAIL ADDRESS</th><th>PHONE</th><th>MEMBER SINCE</th><th>ADDRESS</th><th></th></tr></thead><tbody>{members.map((member) => <tr key={member._id}><td><div className="member-cell"><div className="avatar member-avatar">{initials(member.name)}</div><strong>{member.name}</strong>{member.isSample && <span className="sample-chip">SAMPLE</span>}</div></td><td>{member.email}</td><td>{member.phone}</td><td>{fmtDate(member.membershipDate)}</td><td className="address-cell">{member.address}</td><td><RowActions onEdit={() => onEdit(member)} onDelete={() => onDelete(member)} /></td></tr>)}</tbody></table>{!members.length && <EmptyState title="No members in this view" text={search ? 'Try a different search, or clear the filter.' : 'Add your first reader to the member register.'} action="Add a member" onClick={onAdd} />}</div><div className="table-foot"><span>SHOWING <b>{members.length}</b> MEMBERS</span><span>MEMBERSHIP DETAILS STAY IN YOUR REGISTER</span></div></section>;
}

function CirculationPage({ loans, search, setSearch, onIssue, onReturn }) {
  const [filter, setFilter] = useState('all');
  const visible = loans.filter((loan) => filter === 'all' || loan.status === filter);
  return <section className="panel data-panel"><Toolbar search={search} setSearch={setSearch} placeholder="Search book or member…"><label className="select-wrap"><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All activity</option><option value="issued">On loan</option><option value="returned">Returned</option></select><ChevronDown size={14} /></label></Toolbar><div className="circulation-tabs"><button className={filter === 'all' ? 'tab-current' : ''} onClick={() => setFilter('all')}>All records <span>{loans.length}</span></button><button className={filter === 'issued' ? 'tab-current' : ''} onClick={() => setFilter('issued')}>On loan <span>{loans.filter((l) => l.status === 'issued').length}</span></button><button className={filter === 'returned' ? 'tab-current' : ''} onClick={() => setFilter('returned')}>Returned <span>{loans.filter((l) => l.status === 'returned').length}</span></button></div><div className="data-table-wrap"><table><thead><tr><th>BOOK</th><th>MEMBER</th><th>ISSUED</th><th>DUE DATE</th><th>RETURNED</th><th>STATUS</th><th></th></tr></thead><tbody>{visible.map((loan) => <tr key={loan._id}><td><div className="loan-book"><div className="book-cover cover-2"><BookOpen size={15} /></div><div><strong>{loan.book?.title || 'Book removed'}</strong><small>{loan.book?.author || '—'}</small></div></div></td><td><div className="member-cell"><div className="avatar mini-avatar">{initials(loan.member?.name)}</div><strong>{loan.member?.name || 'Member removed'}</strong></div></td><td>{fmtDate(loan.issuedAt)}</td><td>{fmtDate(loan.dueAt)}</td><td>{fmtDate(loan.returnedAt)}</td><td><span className={`status-pill ${loan.status === 'issued' ? 'status-issued' : 'status-returned'}`}>{loan.status === 'issued' ? 'On loan' : 'Returned'}</span></td><td>{loan.status === 'issued' && <button className="return-button" onClick={() => onReturn(loan)}><Check size={14} /> Return</button>}</td></tr>)}</tbody></table>{!visible.length && <EmptyState title="No circulation records" text={search ? 'Try another search or filter.' : 'Issue a book to start the lending register.'} action="Issue a book" onClick={onIssue} />}</div><div className="table-foot"><span>SHOWING <b>{visible.length}</b> RECORDS</span><span>ISSUE DATE, DUE DATE & RETURN HISTORY</span></div></section>;
}

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button title="Edit" aria-label="Edit" onClick={onEdit}><Pencil size={15} /></button><button title="Delete" aria-label="Delete" className="delete-action" onClick={onDelete}><Trash2 size={15} /></button></div>;
}

function EmptyState({ title, text, action, onClick }) {
  return <div className="empty-state"><div className="empty-icon"><FileText size={21} /></div><strong>{title}</strong><p>{text}</p><button className="btn-outline" onClick={onClick}><Plus size={15} /> {action}</button></div>;
}

function RecordDialog({ dialog, books, members, onClose, onSubmit, saving }) {
  const { type, record } = dialog;
  const editing = Boolean(record);
  const title = type === 'book' ? editing ? 'Edit book details' : 'Add to the collection' : type === 'member' ? editing ? 'Edit member profile' : 'Register a member' : 'Issue a book';
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="panel-kicker">AURORA LIBRARY</span><h2 id="modal-title">{title}</h2></div><button className="icon-btn modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <form onSubmit={onSubmit}>
      {type === 'book' && <div className="form-grid"><Field label="Book title" name="title" required defaultValue={record?.title} placeholder="e.g. The Secret Garden" className="span-two" /><Field label="Author" name="author" required defaultValue={record?.author} placeholder="Author name" /><Field label="Category" name="category" required defaultValue={record?.category} placeholder="e.g. Fiction" /><Field label="ISBN" name="isbn" required defaultValue={record?.isbn} placeholder="978-…" /><Field label="Publication year" name="publicationYear" type="number" min="1000" max="2100" required defaultValue={record?.publicationYear ?? new Date().getFullYear()} /><Field label="Total copies" name="quantity" type="number" min={editing ? Math.max(1, record.quantity - record.availableQuantity) : 1} required defaultValue={record?.quantity ?? 1} /></div>}
      {type === 'member' && <div className="form-grid"><Field label="Full name" name="name" required defaultValue={record?.name} placeholder="Reader’s name" className="span-two" /><Field label="Email address" name="email" type="email" required defaultValue={record?.email} placeholder="reader@example.com" className="span-two" /><Field label="Phone number" name="phone" type="tel" required defaultValue={record?.phone} placeholder="+1 555 0100" /><Field label="Membership date" name="membershipDate" type="date" required defaultValue={record?.membershipDate ? new Date(record.membershipDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} /><Field label="Address" name="address" required defaultValue={record?.address} placeholder="Street, city, postal code" className="span-two" /></div>}
      {type === 'loan' && <div className="form-grid"><label className="form-field span-two"><span>Choose a book</span><select name="bookId" required defaultValue=""><option value="" disabled>Select an available title</option>{books.filter((b) => b.availableQuantity > 0).map((book) => <option key={book._id} value={book._id}>{book.title} · {book.availableQuantity} available</option>)}</select></label><label className="form-field span-two"><span>Issue to member</span><select name="memberId" required defaultValue=""><option value="" disabled>Select a library member</option>{members.map((member) => <option key={member._id} value={member._id}>{member.name} · {member.email}</option>)}</select></label><Field label="Due date" name="dueAt" type="date" defaultValue={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)} className="span-two" /><div className="loan-note"><Clock3 size={16} /><span>Default lending period is <strong>14 days</strong>. Available copies update as soon as the issue is recorded.</span></div></div>}
      <div className="modal-actions"><button type="button" className="btn-text" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}{saving ? 'Saving…' : type === 'loan' ? 'Confirm issue' : editing ? 'Save changes' : type === 'book' ? 'Add book' : 'Add member'}</button></div>
    </form></section></div>;
}

function Field({ label, name, type = 'text', required, defaultValue, placeholder, min, max, className = '' }) {
  return <label className={`form-field ${className}`}><span>{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} min={min} max={max} /></label>;
}

export default function App() {
  const [screen, setScreen] = useState('choose');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api.get('/auth/session')
      .then(({ data }) => { if (data.authenticated) setScreen('admin'); })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  async function logout() {
    try { await api.post('/auth/logout'); } finally { setScreen('choose'); }
  }

  if (checkingSession) return <div className="entry-loading"><LoaderCircle size={19} className="spin" /> Opening Aurora Library…</div>;
  if (screen === 'admin') return <AdminDashboard onLogout={logout} />;
  return <EntryFlow screen={screen} onScreen={setScreen} onAdminSuccess={() => setScreen('admin')} />;
}
