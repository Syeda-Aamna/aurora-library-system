import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink,
  LibraryBig, LoaderCircle, Search, ShieldCheck,
} from 'lucide-react';
import { starterCatalog } from '../shared/catalog-data.js';

const api = axios.create({ baseURL: '/api' });
const date = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? String(value) : '—';
const bookCoverUrl = (isbn) => `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false`;
const openLibraryUrl = (isbn) => `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}`;

export default function EntryFlow({ screen, onScreen, onAdminSuccess }) {
  if (screen === 'reader') return <ReaderPortal onBack={() => onScreen('choose')} onStaff={() => onScreen('admin')} />;
  if (screen === 'admin') return <AdminSignIn onBack={() => onScreen('choose')} onSuccess={onAdminSuccess} />;
  return <RoleChoice onScreen={onScreen} />;
}

function Brand() {
  return (
    <div className="entry-brand">
      <div className="entry-mark"><LibraryBig size={20} strokeWidth={1.8} /></div>
      <div><strong>Library Desk</strong><span>CATALOG · MEMBERS · CIRCULATION</span></div>
    </div>
  );
}

function RoleChoice({ onScreen }) {
  return (
    <main className="entry-shell">
      <header className="entry-header"><Brand /><span className="entry-est">PUBLIC CATALOG <i /> STAFF WORKSPACE</span></header>
      <section className="entry-content">
        <div className="entry-copy">
          <div className="entry-eyebrow"><i /> YOUR LIBRARY, IN ONE PLACE</div>
          <h1>Find a book.<br /><em>Keep it moving.</em></h1>
          <p className="entry-lede">Search the collection as a reader, or manage books and circulation at the staff desk.</p>
          <div className="entry-assurance"><CheckCircle2 size={16} /><span>Clear availability. Carefully managed lending.</span></div>
        </div>
        <div className="role-grid">
          <button className="role-card reader-card" onClick={() => onScreen('reader')}>
            <span className="role-icon"><BookOpen size={21} /></span>
            <span className="role-overline">FOR READERS</span>
            <strong>Browse the catalog</strong>
            <small>Search real titles and see recorded copy availability.</small>
            <span className="role-link">OPEN CATALOG <ArrowRight size={15} /></span>
            <span className="role-index">01</span>
          </button>
          <button className="role-card admin-card" onClick={() => onScreen('admin')}>
            <span className="role-icon"><ShieldCheck size={21} /></span>
            <span className="role-overline">FOR LIBRARY STAFF</span>
            <strong>Staff workspace</strong>
            <small>Manage the collection, member register, and lending desk.</small>
            <span className="role-link">STAFF SIGN-IN <ArrowRight size={15} /></span>
            <span className="role-index">02</span>
          </button>
        </div>
        <div className="entry-quote"><span>One catalog. Every reader. A well-kept record.</span><small>LIBRARY DESK</small></div>
      </section>
      <footer className="entry-footer"><span>LIBRARY DESK <i>·</i> COLLECTION & CIRCULATION</span><span>OPEN TO THE COMMUNITY</span></footer>
    </main>
  );
}

function ReaderPortal({ onBack, onStaff }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [catalogPreview, setCatalogPreview] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/public/books')
      .then(({ data }) => { if (active) setBooks(data); })
      .catch(() => {
        if (!active) return;
        setBooks(starterCatalog.map((book) => ({
          ...book,
          _id: `catalog-${book.isbn}`,
          quantity: 0,
          availableQuantity: 0,
          coverUrl: bookCoverUrl(book.isbn),
          sourceUrl: openLibraryUrl(book.isbn),
        })));
        setCatalogPreview(true);
        setNotice('The live library database is not connected. These are real bibliographic records; physical holdings and availability have not been recorded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => books.filter((book) =>
    [book.title, book.author, book.category, book.isbn].some((value) => value?.toLowerCase().includes(search.toLowerCase())),
  ), [books, search]);

  return (
    <main className="reader-shell">
      <header className="entry-header"><Brand /><button className="entry-back" onClick={onBack}><ArrowLeft size={15} /> Choose another view</button></header>
      <section className="reader-head">
        <div>
          <div className="entry-eyebrow"><i /> PUBLIC CATALOG</div>
          <h1>Explore the<br /><em>collection.</em></h1>
          <p>Search titles, authors, and subjects. Availability reflects copies recorded by the library.</p>
        </div>
        <div className="reader-illustration"><LibraryBig size={46} strokeWidth={1.25} /><span>SEARCH · DISCOVER · READ</span></div>
      </section>
      <section className="catalog-panel">
        <div className="catalog-toolbar">
          <div><span className="role-overline">THE COLLECTION</span><h2>Find a title</h2></div>
          <label className="catalog-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, authors, ISBN…" /></label>
        </div>
        {catalogPreview && <div className="catalog-notice" role="status"><AlertCircle size={17} /><span><strong>Catalog metadata preview</strong>{notice} Availability is not live.</span></div>}
        {loading ? <div className="catalog-loading"><LoaderCircle className="spin" size={18} /> Connecting to the catalog…</div> : visible.length ? (
          <div className="public-book-grid">
            {visible.map((book) => <BookCard key={book._id} book={book} />)}
          </div>
        ) : <div className="catalog-empty"><BookOpen size={22} /><strong>{search ? 'No matching titles' : 'No catalog records yet'}</strong><span>{search ? 'Try a different title, author, ISBN, or subject.' : 'Books will appear here once the library catalog is connected.'}</span></div>}
      </section>
      <footer className="entry-footer"><span>LIBRARY DESK <i>·</i> PUBLIC CATALOG</span><div className="reader-footer-links"><a href="https://openlibrary.org/" target="_blank" rel="noreferrer">Cover metadata by Open Library <ExternalLink size={12} /></a><button onClick={onStaff}>STAFF SIGN-IN <ArrowRight size={13} /></button></div></footer>
    </main>
  );
}

function BookCard({ book }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const availability = book.quantity === 0
    ? 'No copies recorded'
    : book.availableQuantity > 0
      ? `${book.availableQuantity} available`
      : 'All copies on loan';
  return (
    <article className="public-book">
      <a className="public-cover" href={book.sourceUrl || openLibraryUrl(book.isbn)} target="_blank" rel="noreferrer" aria-label={`Open ${book.title} record at Open Library`}>
        {!coverFailed && <img src={book.coverUrl || bookCoverUrl(book.isbn)} alt={`Cover of ${book.title}`} loading="lazy" onError={() => setCoverFailed(true)} />}
        {coverFailed && <span className="cover-fallback"><BookOpen size={25} /><small>LIBRARY DESK</small></span>}
      </a>
      <div className="public-book-info">
        <span className="public-category">{book.category}</span>
        <h3>{book.title}</h3>
        <p>{book.author}</p>
        <div className="public-book-meta"><span>{date(book.publicationYear)}</span><span className="book-isbn">ISBN {book.isbn}</span></div>
        <div className="public-book-bottom"><span className={`availability ${book.availableQuantity > 0 ? 'available' : 'unavailable'}`}><i />{availability}</span><a href={book.sourceUrl || openLibraryUrl(book.isbn)} target="_blank" rel="noreferrer">Edition record <ExternalLink size={12} /></a></div>
      </div>
    </article>
  );
}

function AdminSignIn({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState({ checking: true });
  const databaseMissing = !runtimeStatus.databaseConfigured;
  const databaseOffline = runtimeStatus.databaseConfigured && !runtimeStatus.databaseConnected;
  const adminMissing = !runtimeStatus.adminConfigured;
  const setupIncomplete = !runtimeStatus.checking && (
    runtimeStatus.unavailable || databaseMissing || databaseOffline || adminMissing
  );

  useEffect(() => {
    api.get('/health')
      .then(({ data }) => setRuntimeStatus({ ...data, checking: false }))
      .catch(() => setRuntimeStatus({ checking: false, unavailable: true }));
  }, []);

  async function submit(event) {
    event.preventDefault(); setError(''); setSaving(true);
    try { await api.post('/auth/admin/login', { email, password }); onSuccess(); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Could not sign in. Please try again.'); }
    finally { setSaving(false); }
  }

  const requiredSettings = [
    ...(databaseMissing ? ['MONGODB_URI'] : []),
    ...(adminMissing ? ['SESSION_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'] : []),
  ];
  const setupTitle = runtimeStatus.unavailable
    ? 'Library service unavailable'
    : databaseMissing
      ? 'Database setup required'
      : databaseOffline
        ? 'Database connection unavailable'
        : 'Staff access setup required';

  return (
    <main className="entry-shell">
      <header className="entry-header"><Brand /><button className="entry-back" onClick={onBack}><ArrowLeft size={15} /> Choose another view</button></header>
      <section className="login-layout">
        <div className="login-story">
          <div className="entry-eyebrow"><i /> STAFF WORKSPACE</div>
          <h1>Manage the<br /><em>library desk.</em></h1>
          <p>Sign in to manage catalog records, member details, and lending activity.</p>
          <div className="login-motto"><BookOpen size={19} /><span>Secure access for authorized library staff.</span></div>
        </div>
        <form className="login-card" onSubmit={submit}>
          <div className="login-lock"><ShieldCheck size={21} /></div>
          <span className="role-overline">STAFF SIGN-IN</span>
          <h2>{setupIncomplete ? 'Staff workspace setup' : 'Sign in to Library Desk'}</h2>
          <p>{setupIncomplete ? 'Staff controls remain locked until storage and administrator access are ready.' : 'Authorized staff can manage the library records from here.'}</p>
          {setupIncomplete && <div className="setup-required" role="status">
            <AlertCircle size={18} />
            <div>
              <strong>{setupTitle}</strong>
              <p>{runtimeStatus.unavailable ? 'The API health check could not be reached. Try again later or review the deployment.' : databaseOffline ? 'The configured MongoDB service could not be reached. Check the URI and database network access; no credential values are displayed here.' : 'The staff desk cannot open until the production database and administrator authentication are configured.'}</p>
              {requiredSettings.length > 0 && <>
                <code>{requiredSettings.join(' · ')}</code>
                <small>Add only missing settings to the separate Vercel project’s Production Environment, then redeploy. Keep secrets out of source control.</small>
              </>}
            </div>
          </div>}
          {error && <div className="login-error"><AlertCircle size={15} />{error}</div>}
          {!setupIncomplete && <>
            <label className="login-field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@your-library.org" /></label>
            <label className="login-field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
            <button className="login-submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : null}{saving ? 'Checking credentials…' : 'Open staff workspace'}{!saving && <ArrowRight size={15} />}</button>
            <div className="login-security"><CheckCircle2 size={14} />Protected staff access</div>
          </>}
          {setupIncomplete && <div className="login-security setup-locked"><ShieldCheck size={14} />Administrator controls are locked</div>}
        </form>
      </section>
      <footer className="entry-footer"><span>LIBRARY DESK <i>·</i> STAFF WORKSPACE</span><span>AUTHORIZED ACCESS ONLY</span></footer>
    </main>
  );
}
