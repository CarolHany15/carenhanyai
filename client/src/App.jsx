import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const money = (value) => `${Number(value || 0).toLocaleString('en-US')} EGP`;
const dateTime = (value) => new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark">✳</span><span>DAHAB<span className="brand-thin"> DIVE CENTER</span></span></div>;
}
function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }
function Alert({ message, type = 'error' }) { return message ? <div className={`alert ${type}`} role="status">{message}</div> : null; }

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api('/api/auth/me').then((data) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* clear local UI either way */ }
    setUser(null); setPage('home'); notify('You have been logged out.');
  };

  const navigate = (next) => { setPage(next); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading) return <div className="loading-screen"><Brand /><div className="loader" /><p>Preparing your Red Sea adventure…</p></div>;

  return <>
    <header className="site-header">
      <div className="nav-wrap">
        <button className="brand-button" onClick={() => navigate('home')} aria-label="Go to homepage"><Brand /></button>
        <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? '✕' : '☰'}</button>
        <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}>
          <button className={page === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}>Home</button>
          <button onClick={() => navigate('sessions')} className={page === 'sessions' ? 'nav-active' : ''}>Dive sessions</button>
          {user?.role === 'customer' && <button onClick={() => navigate('my-bookings')} className={page === 'my-bookings' ? 'nav-active' : ''}>My bookings</button>}
          {user?.role === 'receptionist' && <button onClick={() => navigate('receptionist')} className={page === 'receptionist' ? 'nav-active' : ''}>Reception desk</button>}
          {!user ? <button className="nav-cta" onClick={() => { setAuthMode('login'); navigate('auth'); }}>Sign in <span>↗</span></button> : <div className="nav-user"><span className="avatar">{user.email?.[0]?.toUpperCase() || 'D'}</span><span className="user-email">{user.email}</span><button className="logout-link" onClick={logout}>Log out</button></div>}
        </nav>
      </div>
    </header>

    <main>
      {page === 'home' && <Home navigate={navigate} user={user} />}
      {page === 'auth' && <Auth mode={authMode} setMode={setAuthMode} onSuccess={(u) => { setUser(u); navigate(u.role === 'receptionist' ? 'receptionist' : 'sessions'); notify('Welcome to DAHAB DIVE CENTER!'); }} />}
      {page === 'sessions' && <Sessions user={user} navigate={navigate} notify={notify} />}
      {page === 'my-bookings' && <MyBookings navigate={navigate} />}
      {page === 'receptionist' && <Receptionist />}
    </main>

    <Footer navigate={navigate} />
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </>;
}

function Home({ navigate, user }) {
  return <>
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content wrap">
        <div className="eyebrow"><span /> DAHAB, SOUTH SINAI · EGYPT</div>
        <h1>The sea is calling.<br /><em>Answer it.</em></h1>
        <p>Discover the magic beneath the Red Sea. Small groups, passionate instructors, and unforgettable dives in the heart of Dahab.</p>
        <div className="hero-actions"><button className="btn btn-primary" onClick={() => navigate('sessions')}>Explore dive sessions <span>↗</span></button><button className="btn btn-ghost" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>Discover our center <span>↓</span></button></div>
        <div className="hero-note"><span className="note-line" /> <span>YOUR NEXT ADVENTURE STARTS HERE</span></div>
      </div>
      <div className="hero-side-label">29°29' N &nbsp; 34°31' E</div>
      <div className="hero-bottom wrap"><div><strong>01</strong><span>Explore</span></div><div><strong>02</strong><span>Book your dive</span></div><div><strong>03</strong><span>Make a memory</span></div></div>
    </section>
    <section className="intro-section wrap" id="about">
      <div className="section-kicker">WELCOME TO THE BLUE</div>
      <div className="intro-grid"><h2>More than a dive.<br /><em>A whole new world.</em></h2><div className="intro-copy"><p>Dahab is one of the Red Sea's most special places. From colorful coral gardens to crystal-clear water, every dive has a story waiting for you.</p><p>Whether it's your first time underwater or your hundredth, our team is here to make every moment safe, personal, and unforgettable.</p><button className="text-link" onClick={() => navigate('sessions')}>Find your next dive <span>↗</span></button></div></div>
    </section>
    <section className="experience-section">
      <div className="wrap experience-grid"><div className="experience-photo"><div className="photo-caption">THE RED SEA · DAHAB</div></div><div className="experience-copy"><div className="section-kicker">THE DAHAB EXPERIENCE</div><h2>Small groups.<br /><em>Big adventures.</em></h2><p>We believe the best dives happen when you have the space to explore. Enjoy personal attention from experienced instructors and discover the Red Sea at your own pace.</p><div className="feature-list"><div><b>01</b><span><strong>Local knowledge</strong><small>We know these waters like home.</small></span></div><div><b>02</b><span><strong>Safety first</strong><small>Professional guidance at every step.</small></span></div><div><b>03</b><span><strong>Made for you</strong><small>Experiences for every skill level.</small></span></div></div><button className="btn btn-dark" onClick={() => navigate('sessions')}>See available sessions <span>↗</span></button></div></div>
    </section>
    <section className="quote-section wrap"><span className="quote-mark">“</span><blockquote>There is a different kind of freedom<br />when you breathe <em>underwater.</em></blockquote><div className="quote-line" /><span className="quote-by">COME FIND YOURS IN DAHAB</span></section>
    <section className="cta-band"><div className="wrap cta-inner"><div><div className="section-kicker">READY TO DIVE IN?</div><h2>Your Red Sea story<br /><em>starts here.</em></h2></div><button className="btn btn-primary" onClick={() => navigate(user ? 'sessions' : 'auth')}>{user ? 'Book a dive' : 'Join the adventure'} <span>↗</span></button></div></section>
  </>;
}

function Auth({ mode, setMode, onSuccess }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await api(`/api/auth/${isRegister ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(form) });
      onSuccess(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <section className="auth-page"><div className="auth-image"><div className="auth-image-content"><Brand light /><div className="auth-image-quote">BREATHE IN.<br /><em>DIVE DEEP.</em></div><p>Somewhere beneath the surface, a whole new world is waiting.</p></div></div><div className="auth-panel"><div className="auth-form-wrap"><div className="section-kicker">{isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</div><h1>{isRegister ? 'Create your account.' : 'Good to see you.'}</h1><p className="muted">{isRegister ? 'Join us and get ready to explore the Red Sea.' : 'Sign in to manage your diving adventures.'}</p>
    <form onSubmit={submit} className="form-stack">
      {isRegister && <label>Full name<input name="fullName" value={form.fullName} onChange={change} placeholder="Your full name" required minLength="2" /></label>}
      <label>Email address<input type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required /></label>
      {isRegister && <label>Phone number <span className="optional">(optional)</span><input name="phone" value={form.phone} onChange={change} placeholder="+20 1XX XXX XXXX" /></label>}
      <label>Password<input type="password" name="password" value={form.password} onChange={change} placeholder={isRegister ? 'At least 10 characters' : 'Your password'} required minLength={isRegister ? 10 : 1} /></label>
      <Alert message={error} />
      <button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <span>↗</span></button>
    </form>
    <div className="auth-switch">{isRegister ? 'Already have an account?' : "Don't have an account?"} <button onClick={() => { setError(''); setMode(isRegister ? 'login' : 'register'); }}>{isRegister ? 'Sign in' : 'Create one'}</button></div>
    <div className="auth-security"><Icon>♧</Icon><span>Your password is securely protected. We never store plain-text passwords.</span></div>
  </div></div></section>;
}

function Sessions({ user, navigate, notify }) {
  const [sessions, setSessions] = useState([]); const [instructors, setInstructors] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [selected, setSelected] = useState(null); const [instructorId, setInstructorId] = useState(''); const [phone, setPhone] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [s, i] = await Promise.all([api('/api/sessions'), api('/api/instructors')]); setSessions(s.sessions || []); setInstructors(i.instructors || []); } catch (e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { if (user) load(); else setLoading(false); }, [user, load]);
  const book = async (e) => { e.preventDefault(); if (!user) { navigate('auth'); return; } setBusy(true); setError(''); try { await api('/api/bookings', { method: 'POST', body: JSON.stringify({ sessionId: selected.id, instructorId: instructorId || undefined, phone }) }); setSelected(null); setPhone(''); setInstructorId(''); notify('Your booking request has been sent!'); navigate('my-bookings'); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <section className="content-page wrap"><div className="page-heading"><div><div className="section-kicker">FIND YOUR NEXT ADVENTURE</div><h1>Explore dive <em>sessions.</em></h1><p>Choose a date, meet your instructor, and get ready to discover the Red Sea.</p></div><div className="heading-stamp">DAHAB<br /><span>RED SEA · EGYPT</span></div></div>
    {!user && <div className="notice"><span>✳</span><div><strong>Sign in to explore available dives</strong><p>Sign in or create an account to view live sessions and reserve your spot.</p></div><button className="text-link" onClick={() => navigate('auth')}>Sign in ↗</button></div>}
    <Alert message={error} />
    {!user ? <div className="empty-state"><div className="empty-icon">◌</div><h3>Your next adventure is one sign-in away</h3><p>Sign in to see available dates, prices, and instructors.</p><button className="text-link" onClick={() => navigate('auth')}>Sign in to continue ↗</button></div> : loading ? <div className="empty-state"><div className="loader" /><p>Loading available sessions…</p></div> : sessions.length === 0 ? <div className="empty-state"><div className="empty-icon">◌</div><h3>No sessions available just yet</h3><p>Our next adventures will appear here. Please check back soon.</p></div> : <div className="session-grid">{sessions.map((s, index) => <article className="session-card" key={s.id}><div className={`session-image session-image-${index % 3}`}><span className="session-number">DIVE 0{index + 1}</span><span className="spots-pill">{s.spots_remaining} spots left</span></div><div className="session-body"><div className="session-date">{dateTime(s.start_time)}</div><h3>{s.title}</h3><div className="session-meta"><span><Icon>◷</Icon> Guided experience</span><span><Icon>⌖</Icon> Dahab, Red Sea</span></div><div className="session-card-bottom"><strong>{money(s.price)}</strong><button className="btn btn-small btn-dark" disabled={Number(s.spots_remaining) <= 0} onClick={() => { setSelected(s); setError(''); }}> {Number(s.spots_remaining) <= 0 ? 'Fully booked' : 'Book now'} <span>↗</span></button></div></div></article>)}</div>}
    {selected && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><div className="booking-modal"><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="section-kicker">RESERVE YOUR SPOT</div><h2>{selected.title}</h2><p className="muted">{dateTime(selected.start_time)} · {money(selected.price)}</p>{!user ? <><p>Please sign in before completing your booking.</p><button className="btn btn-primary btn-full" onClick={() => navigate('auth')}>Sign in to continue ↗</button></> : <form onSubmit={book} className="form-stack"><label>Contact phone number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 1XX XXX XXXX" required minLength="5" /></label><label>Preferred instructor <span className="optional">(optional)</span><select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}><option value="">Any available instructor</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}</select></label><Alert message={error} /><button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Sending request…' : 'Confirm booking request ↗'}</button><small className="form-hint">Your booking will be marked as pending until the reception team confirms it.</small></form>}</div></div>}
  </section>;
}

function MyBookings({ navigate }) {
  const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api('/api/bookings/my').then((d) => setBookings(d.bookings || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <section className="content-page wrap"><div className="page-heading"><div><div className="section-kicker">YOUR ADVENTURES</div><h1>My <em>bookings.</em></h1><p>All your diving plans, gathered in one place.</p></div><div className="heading-stamp">YOUR<br /><span>DIVE LOG</span></div></div><Alert message={error} />{loading ? <div className="empty-state"><div className="loader" /><p>Loading your bookings…</p></div> : bookings.length === 0 ? <div className="empty-state"><div className="empty-icon">◌</div><h3>Your next adventure is waiting</h3><p>You haven't booked a dive session yet.</p><button className="text-link" onClick={() => navigate('sessions')}>Explore dive sessions ↗</button></div> : <div className="table-wrap"><table><thead><tr><th>DIVE SESSION</th><th>DATE & TIME</th><th>INSTRUCTOR</th><th>PRICE</th><th>STATUS</th></tr></thead><tbody>{bookings.map((b) => <tr key={b.id}><td><strong>{b.session_title}</strong><small>Booking #{b.id.slice(0, 8)}</small></td><td>{dateTime(b.start_time)}</td><td>{b.instructor_name || 'To be assigned'}</td><td>{money(b.price)}</td><td><span className={`status status-${b.status}`}>{b.status}</span></td></tr>)}</tbody></table></div>}</section>;
}

function Receptionist() {
  const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [updating, setUpdating] = useState('');
  const load = useCallback(() => { setLoading(true); api('/api/bookings').then((d) => setBookings(d.bookings || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const updateStatus = async (id, status) => { setUpdating(id); setError(''); try { await api(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); } catch (e) { setError(e.message); } finally { setUpdating(''); } };
  const pending = bookings.filter((b) => b.status === 'pending').length; const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  return <section className="content-page wrap"><div className="page-heading"><div><div className="section-kicker">TEAM WORKSPACE</div><h1>Reception <em>desk.</em></h1><p>Review reservations and keep every dive running smoothly.</p></div><div className="heading-stamp">STAFF<br /><span>CONTROL PANEL</span></div></div><Alert message={error} /><div className="stats-grid"><div className="stat-card"><span>TOTAL BOOKINGS</span><strong>{bookings.length}</strong><small>All reservations</small></div><div className="stat-card"><span>WAITING FOR YOU</span><strong>{pending}</strong><small>Pending requests</small></div><div className="stat-card"><span>CONFIRMED</span><strong>{confirmed}</strong><small>Ready to dive</small></div></div>
    <div className="table-heading"><div><h2>All reservations</h2><p>Update the status after reviewing each booking.</p></div><button className="btn btn-outline btn-small" onClick={load}>↻ Refresh</button></div>
    {loading ? <div className="empty-state"><div className="loader" /><p>Loading reservations…</p></div> : bookings.length === 0 ? <div className="empty-state"><h3>No bookings yet</h3><p>New customer reservations will appear here.</p></div> : <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>SESSION</th><th>DATE</th><th>PHONE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{bookings.map((b) => <tr key={b.id}><td><strong>{b.customer_name}</strong><small>{b.customer_email}</small></td><td>{b.session_title}<small>{b.instructor_name || 'No instructor selected'}</small></td><td>{dateTime(b.start_time)}</td><td>{b.booking_phone || '—'}</td><td><span className={`status status-${b.status}`}>{b.status}</span></td><td><select className="status-select" disabled={updating === b.id} value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div>}
  </section>;
}

function Footer({ navigate }) {
  return <footer className="footer"><div className="wrap footer-top"><div><Brand light /><p>Explore the extraordinary.<br />One dive at a time.</p></div><div className="footer-links"><span>EXPLORE</span><button onClick={() => navigate('home')}>Home</button><button onClick={() => navigate('sessions')}>Dive sessions</button></div><div className="footer-links"><span>VISIT US</span><p>Dahab, South Sinai<br />Red Sea, Egypt</p><a href="mailto:hello@dahabdive.example">Get in touch ↗</a></div><div className="footer-coordinates">29°29' N<br />34°31' E</div></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} DAHAB DIVE CENTER</span><span>MADE FOR THE BLUE.</span></div></footer>;
}
