import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle, ArrowLeft, ArrowRight, BookMarked, BookOpen, CheckCircle2,
  LibraryBig, LoaderCircle, Search, ShieldCheck, Sparkles,
} from 'lucide-react';
import { sampleBooks } from '../shared/demo-data.js';

const api = axios.create({ baseURL: '/api' });
const date = (value) => value ? (typeof value === 'number' ? value : new Date(value).getFullYear()) : '—';

export default function EntryFlow({ screen, onScreen, onAdminSuccess }) {
  if (screen === 'reader') return <ReaderPortal onBack={() => onScreen('choose')} />;
  if (screen === 'admin') return <AdminSignIn onBack={() => onScreen('choose')} onSuccess={onAdminSuccess} />;
  return <RoleChoice onScreen={onScreen} />;
}

function Brand() {
  return (
    <div className="entry-brand">
      <div className="entry-mark"><img src="/aurora-logo.png" alt="Aurora Store" /></div>
      <div><strong>Aurora Store</strong><span>READ · DREAM · LEARN · GROW</span></div>
    </div>
  );
}

function RoleChoice({ onScreen }) {
  return (
    <main className="entry-shell">
      <header className="entry-header"><Brand /><span className="entry-est">EST. 2026 <i /> STORIES · IDEAS · WONDER</span></header>
      <section className="entry-content">
        <div className="entry-copy">
          <div className="entry-eyebrow"><i /> THE READING ROOM IS OPEN</div>
          <h1>A place for every<br /><em>kind of reader.</em></h1>
          <p className="entry-lede">Come in, find your next story, or take your place at the library desk.</p>
        </div>
        <div className="entry-hero-logo">
          <div className="logo-aura"><img src="/aurora-logo.png" alt="Aurora Store emblem" /></div>
          <span>AURORA STORE · EST. 2026</span><small>READ · DREAM · LEARN · GROW</small>
        </div>
        <div className="role-grid">
          <button className="role-card reader-card" onClick={() => onScreen('reader')}>
            <span className="role-icon"><BookOpen size={21} /></span>
            <span className="role-overline">FOR VISITORS & MEMBERS</span>
            <strong>Browse as a reader</strong>
            <small>Explore the collection and see what’s ready to borrow.</small>
            <span className="role-link">ENTER THE LIBRARY <ArrowRight size={15} /></span>
            <span className="role-index">01</span>
          </button>
          <button className="role-card admin-card" onClick={() => onScreen('admin')}>
            <span className="role-icon"><ShieldCheck size={21} /></span>
            <span className="role-overline">FOR LIBRARY STAFF</span>
            <strong>Administrator sign-in</strong>
            <small>Manage the catalog, members, and circulation desk.</small>
            <span className="role-link">STAFF ACCESS <ArrowRight size={15} /></span>
            <span className="role-index">02</span>
          </button>
        </div>
        <div className="entry-quote"><span>“Every page opens a door.”</span><small>THE AURORA LIBRARY MOTTO</small></div>
      </section>
      <footer className="entry-footer"><span>AURORA LIBRARY <i>·</i> EST. 2026</span><span>OPEN TO THE CURIOUS</span></footer>
    </main>
  );
}

function ReaderPortal({ onBack }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoFallback, setDemoFallback] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/public/books'), api.get('/health')])
      .then(([bookResponse, healthResponse]) => {
        setBooks(bookResponse.data);
        setDemoFallback(Boolean(healthResponse.data.demoMode));
      })
      .catch((requestError) => {
        if (requestError.response?.data?.error?.includes('Database is not configured')) {
          setBooks(sampleBooks.map((book, index) => ({ ...book, _id: `preview-sample-${index + 1}` })));
          setDemoFallback(true);
        } else {
          setError(requestError.response?.data?.error || 'The catalog is temporarily unavailable.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => books.filter((book) =>
    [book.title, book.author, book.category].some((value) => value?.toLowerCase().includes(search.toLowerCase())),
  ), [books, search]);

  return (
    <main className="reader-shell">
      <header className="entry-header"><Brand /><button className="entry-back" onClick={onBack}><ArrowLeft size={15} /> Choose another view</button></header>
      <section className="reader-head">
        <div>
          <div className="entry-eyebrow"><i /> THE PUBLIC CATALOG</div>
          <h1>Find a story<br /><em>worth keeping.</em></h1>
          <p>Browse Aurora’s collection and see what’s available to borrow.</p>
        </div>
        <div className="reader-illustration"><LibraryBig size={58} strokeWidth={1} /><span>THE COLLECTION</span></div>
      </section>
      <section className="catalog-panel">
        <div className="catalog-toolbar">
          <div><span className="role-overline">ON THE SHELVES</span><h2>Explore the collection</h2></div>
          <label className="catalog-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, authors, categories…" /></label>
        </div>
        {books.some((book) => book.isSample) && (
          <div className="sample-notice sample-public"><Sparkles size={16} /><span>
            <strong>{demoFallback ? 'Preview-only demo data' : 'Fictional sample collection'}</strong> · Six imaginary titles with authors are shown to explore the catalog. {demoFallback && 'The database is not connected, so preview data will not persist.'}
          </span></div>
        )}
        {error && <div className="catalog-error"><AlertCircle size={16} />{error}</div>}
        {loading ? <div className="catalog-loading"><LoaderCircle className="spin" size={18} /> Opening the catalog…</div> : visible.length ? (
          <div className="public-book-grid">
            {visible.map((book, index) => (
              <article className="public-book" key={book._id}>
                <div className={`public-cover cover-${index % 4}`}><BookOpen size={20} /><span>{String(index + 1).padStart(2, '0')}</span></div>
                <div className="public-book-info">
                  <span className="public-category">{book.category}</span><h3>{book.title}</h3>
                  {book.isSample && <span className="public-sample">SAMPLE TITLE</span>}
                  <p>{book.author}</p>
                  <div className="public-book-bottom"><span>{date(book.publicationYear)}</span><span className={`availability ${book.availableQuantity > 0 ? 'available' : 'unavailable'}`}><i />{book.availableQuantity > 0 ? `${book.availableQuantity} available` : 'Currently on loan'}</span></div>
                </div>
              </article>
            ))}
          </div>
        ) : !error && <div className="catalog-empty"><BookOpen size={22} /><strong>{search ? 'No matching titles' : 'The shelves are being arranged'}</strong><span>{search ? 'Try a different title, author, or category.' : 'The collection will appear here once books are added.'}</span></div>}
      </section>
      <footer className="entry-footer"><span>AURORA LIBRARY <i>·</i> READ. DREAM. LEARN. GROW.</span><button onClick={onBack}>STAFF ACCESS <ArrowRight size={13} /></button></footer>
    </main>
  );
}

function AdminSignIn({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState({ checking: true });
  const demoMode = Boolean(runtimeStatus.demoMode);
  const setupIncomplete = !runtimeStatus.checking && !demoMode && (
    runtimeStatus.unavailable || !runtimeStatus.databaseConfigured || !runtimeStatus.adminConfigured
  );

  useEffect(() => {
    api.get('/health')
      .then(({ data }) => setRuntimeStatus({ ...data, checking: false }))
      .catch(() => setRuntimeStatus({ checking: false, unavailable: true }));
  }, []);

  async function enterDemo() {
    setError(''); setSaving(true);
    try { await api.post('/auth/admin/demo-login'); onSuccess(); }
    catch (requestError) { setError(requestError.response?.data?.error || 'The preview desk could not be opened.'); }
    finally { setSaving(false); }
  }

  async function submit(event) {
    event.preventDefault(); setError(''); setSaving(true);
    try { await api.post('/auth/admin/login', { email, password }); onSuccess(); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Could not sign in. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <main className="entry-shell">
      <header className="entry-header"><Brand /><button className="entry-back" onClick={onBack}><ArrowLeft size={15} /> Choose another view</button></header>
      <section className="login-layout">
        <div className="login-story">
          <div className="entry-eyebrow"><i /> STAFF ACCESS</div>
          <h1>Welcome back<br /><em>to the desk.</em></h1>
          <p>Sign in to manage the Aurora collection, members, and lending activity.</p>
          <div className="login-motto"><BookMarked size={19} /><span>“Every page opens a door.”</span></div>
        </div>
        <form className="login-card" onSubmit={submit}>
          <div className="login-lock"><ShieldCheck size={21} /></div>
          <span className="role-overline">ADMINISTRATOR</span>
          <h2>{setupIncomplete ? 'Library desk setup' : 'Sign in to Aurora'}</h2>
          <p>{setupIncomplete ? 'The staff workspace is safely locked until this deployment is ready.' : 'Your library records are accessible to staff only.'}</p>
          {setupIncomplete && <div className="setup-required" role="status">
            <AlertCircle size={18} />
            <div>
              <strong>{runtimeStatus.unavailable ? 'Library service unavailable' : 'Production setup required'}</strong>
              <p>{runtimeStatus.unavailable ? 'The library service could not be reached. Try again later or check the deployment.' : 'Staff operations need persistent storage and administrator authentication. The reader catalog remains a read-only preview until these are configured.'}</p>
              {!runtimeStatus.unavailable && <>
                <code>MONGODB_URI · SESSION_SECRET · ADMIN_EMAIL · ADMIN_PASSWORD</code>
                <small>Add any missing values to the new Vercel project’s Production Environment, then redeploy. Keep secret values out of source code.</small>
              </>}
            </div>
          </div>}
          {demoMode && <div className="demo-login-note"><Sparkles size={16} /><span><strong>Interactive preview desk.</strong> Uses fictional data stored only in this preview process.</span></div>}
          {error && <div className="login-error"><AlertCircle size={15} />{error}</div>}
          {demoMode && <button type="button" className="demo-login-button" onClick={enterDemo} disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <LibraryBig size={16} />}{saving ? 'Opening demo desk…' : 'Enter librarian demo'}<ArrowRight size={15} /></button>}
          {!setupIncomplete && <>
            <div className="login-divider">{demoMode ? 'OR SIGN IN WITH STAFF CREDENTIALS' : 'STAFF CREDENTIALS'}</div>
            <label className="login-field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@yourlibrary.org" /></label>
            <label className="login-field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
            <button className="login-submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : null}{saving ? 'Checking credentials…' : 'Open library desk'}{!saving && <ArrowRight size={15} />}</button>
            <div className="login-security"><CheckCircle2 size={14} />Protected staff access</div>
          </>}
          {setupIncomplete && <div className="login-security setup-locked"><ShieldCheck size={14} />Administrator workspace unavailable until setup is complete</div>}
        </form>
      </section>
      <footer className="entry-footer"><span>AURORA LIBRARY <i>·</i> EST. 2026</span><span>PRIVATE STAFF WORKSPACE</span></footer>
    </main>
  );
}
