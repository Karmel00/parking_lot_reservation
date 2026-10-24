import React, { useEffect, useMemo, useState } from 'react';
import Icon from './components/Icons.jsx';
import { getParkings, useMockApi } from './services/parkingService.js';

const STORAGE_KEY = 'parkflow-demo-reservations-v1';
const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });

function localDatetime(daysForward, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysForward);
  date.setHours(hour, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function loadReservations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function getHours(from, to) {
  const interval = (new Date(to).getTime() - new Date(from).getTime()) / 3600000;
  return Number.isFinite(interval) && interval > 0 ? Math.ceil(interval) : 0;
}
function hasOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}
function dateLabel(value) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function ParkingArtwork({ variant }) {
  return <div className={`parking-art parking-art--${variant}`} aria-hidden="true">
    <div className="art-building art-building--first" />
    <div className="art-building art-building--second" />
    <div className="art-street"><span /><span /><span /></div>
    <div className="art-parking-sign">P</div>
    <div className="art-car art-car--one" /><div className="art-car art-car--two" />
    <div className="art-shadow" />
  </div>;
}
function Header({ view, setView }) {
  return <header className="site-header">
    <div className="nav-container">
      <button className="brand" onClick={() => setView('search')} aria-label="ParkFlow – strona główna">
        <span className="brand-mark"><Icon name="car" size={24}/></span>
        <span>park<span className="brand-accent">flow</span><span className="brand-dot">.</span></span>
      </button>
      <nav className="main-nav" aria-label="Menu główne">
        <button className={view === 'search' ? 'nav-active' : ''} onClick={() => setView('search')}>Znajdź parking</button>
        <button className={view === 'reservations' ? 'nav-active' : ''} onClick={() => setView('reservations')}>Moje rezerwacje</button>
        <button className={view === 'admin' ? 'nav-active' : ''} onClick={() => setView('admin')}>Panel administratora</button>
      </nav>
      <div className="header-right"><span className="demo-pill"><span className="demo-indicator"/>Wersja demonstracyjna</span><span className="avatar" title="Użytkownik demonstracyjny">D</span></div>
    </div>
  </header>;
}
function ParkingCard({ parking, freeSpots, onBook }) {
  return <article className="parking-card">
    <div className="card-cover"><ParkingArtwork variant={parking.illustration}/><span className="cover-tag"><Icon name="sparkles" size={14}/>{parking.highlight}</span></div>
    <div className="card-body">
      <div className="card-heading"><div><p className="eyebrow">{parking.district}</p><h3>{parking.name}</h3></div><div className="price"><strong>{parking.pricePerHour} zł</strong><span>/ godz.</span></div></div>
      <p className="address"><Icon name="pin" size={17}/>{parking.address}</p>
      <div className="amenities">{parking.features.slice(0, 3).map((name) => <span key={name}>{name}</span>)}</div>
      <div className="card-footer"><span className={`availability ${freeSpots <= 10 ? 'availability--low' : ''}`}><span className="status-dot"/>{freeSpots} wolnych miejsc</span><button className="book-button" disabled={freeSpots <= 0} onClick={() => onBook(parking)}>Rezerwuj <Icon name="arrow" size={18}/></button></div>
    </div>
  </article>;
}
function ReservationModal({ parking, from, to, onClose, onConfirm }) {
  if (!parking) return null;
  const hours = getHours(from, to);
  return <div className="modal-backdrop" onClick={onClose} role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label="Zamknij"><Icon name="close" size={20}/></button>
    <div className="modal-icon"><Icon name="ticket" size={25}/></div>
    <p className="eyebrow">POTWIERDZENIE REZERWACJI · DEMO</p><h2 id="modal-title">Jeszcze tylko jeden krok</h2>
    <p className="modal-intro">Sprawdź szczegóły przed utworzeniem testowej rezerwacji.</p>
    <div className="modal-summary"><div><span>Parking</span><strong>{parking.name}</strong></div><div><span>Rozpoczęcie</span><strong>{dateLabel(from)}</strong></div><div><span>Zakończenie</span><strong>{dateLabel(to)}</strong></div><div><span>Czas parkowania</span><strong>{hours} godz.</strong></div><div className="modal-total"><span>Szacowany koszt</span><strong>{currency.format(hours * parking.pricePerHour)}</strong></div></div>
    <button className="primary-button primary-button--wide" onClick={() => onConfirm(parking)} disabled={hours <= 0}>Potwierdź rezerwację demo <Icon name="arrow" size={18}/></button>
    <p className="modal-note"><Icon name="info" size={15}/> Bez płatności i bez e-maila – dane zapisują się lokalnie w przeglądarce.</p>
  </div></div>;
}
function App() {
  const [view, setView] = useState('search');
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('Wrocław');
  const [submittedLocation, setSubmittedLocation] = useState('Wrocław');
  const [startDate, setStartDate] = useState(() => localDatetime(1, 9));
  const [endDate, setEndDate] = useState(() => localDatetime(1, 13));
  const [searchError, setSearchError] = useState('');
  const [sortOrder, setSortOrder] = useState('recommended');
  const [selectedParking, setSelectedParking] = useState(null);
  const [reservations, setReservations] = useState(loadReservations);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    getParkings().then((data) => { if (active) setParkings(data); }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations)); } catch { /* tryb prywatny */ }
  }, [reservations]);

  const remaining = (parking) => Math.max(0, parking.availableSpots - reservations.filter((r) => r.parkingId === parking.id && r.status === 'active' && hasOverlap(r.from, r.to, startDate, endDate)).length);
  const duration = getHours(startDate, endDate);
  const filteredParkings = useMemo(() => {
    const phrase = submittedLocation.trim().toLocaleLowerCase('pl-PL');
    const items = parkings.filter((p) => `${p.name} ${p.address} ${p.city} ${p.district}`.toLocaleLowerCase('pl-PL').includes(phrase));
    if (sortOrder === 'price') items.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (sortOrder === 'availability') items.sort((a, b) => b.availableSpots - a.availableSpots);
    return items;
  }, [parkings, submittedLocation, sortOrder]);
  const activeReservations = reservations.filter((r) => r.status === 'active');

  function search(event) {
    event.preventDefault();
    if (!duration) { setSearchError('Data zakończenia musi być późniejsza niż data rozpoczęcia.'); return; }
    setSearchError(''); setSubmittedLocation(location);
  }
  function confirmReservation(parking) {
    if (remaining(parking) < 1) { setSearchError('Brak dostępnych miejsc w wybranym terminie.'); setSelectedParking(null); return; }
    const newReservation = { id: `PF-${Date.now()}`, parkingId: parking.id, parkingName: parking.name, address: parking.address, from: startDate, to: endDate, price: getHours(startDate, endDate) * parking.pricePerHour, status: 'active' };
    setReservations((prev) => [newReservation, ...prev]); setSelectedParking(null); setToast('Utworzono testową rezerwację.'); setView('reservations');
  }
  function cancelReservation(id) {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r)); setToast('Rezerwacja została anulowana w trybie demo.');
  }

  return <div className="app-shell">
    <Header view={view} setView={(newView) => { setView(newView); setToast(''); }}/>
    {view === 'search' && <>
      <section className="hero"><div className="hero-inner">
        <div className="hero-copy"><div className="hero-label"><span className="hero-label-dot"/> PROJEKT ZESPOŁOWY · AWS CLOUD</div><h1>Twoje miejsce.<br/><span>Zanim dojedziesz.</span></h1><p>Wybierz parking, sprawdź dostępność i zarezerwuj miejsce w kilka chwil. Bez krążenia po mieście.</p><div className="hero-benefits"><span><Icon name="check" size={16}/> Szybkie wyszukiwanie</span><span><Icon name="check" size={16}/> Przejrzyste ceny</span></div></div>
        <div className="hero-graphic" aria-hidden="true"><div className="hero-circle hero-circle--outer"/><div className="hero-circle hero-circle--inner"/><div className="hero-board"><div className="hero-board-top"><span>PARKFLOW</span><span>24/7</span></div><div className="hero-parking-grid"><div className="slot slot--taken">P</div><div className="slot slot--free">✓</div><div className="slot slot--free">✓</div><div className="slot slot--taken">P</div><div className="slot slot--free">✓</div><div className="slot slot--free">✓</div></div><div className="hero-board-footer"><span className="tiny-dot"/> WOLNE MIEJSCA</div></div><div className="hero-float"><span className="float-icon"><Icon name="check" size={20}/></span><span><strong>Miejsce dostępne!</strong><small>Rezerwacja w kilka kliknięć</small></span></div></div>
      </div></section>
      <main className="main-container">
        <form className="search-panel" onSubmit={search}><div className="search-field search-field--location"><label htmlFor="location"><Icon name="pin" size={18}/> Lokalizacja</label><input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Miasto lub nazwa parkingu"/></div><div className="form-divider"/><div className="search-field"><label htmlFor="date-from"><Icon name="calendar" size={18}/> Od kiedy?</label><input id="date-from" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required/></div><div className="form-divider"/><div className="search-field"><label htmlFor="date-to"><Icon name="clock" size={18}/> Do kiedy?</label><input id="date-to" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required/></div><button className="primary-button search-submit" type="submit"><Icon name="search" size={19}/> Szukaj miejsc</button></form>
        {searchError && <p className="form-error" role="alert">{searchError}</p>}
        <div className="section-header"><div><div className="section-overline">ODKRYJ PARKINGI</div><h2>Dostępne miejsca <span>w Twojej okolicy</span></h2><p>{loading ? 'Wczytywanie danych...' : `${filteredParkings.length} parkingów · ${duration} godz. parkowania · dane demonstracyjne`}</p></div><label className="sort-field"><Icon name="filter" size={18}/><select aria-label="Sortuj parkingi" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}><option value="recommended">Polecane</option><option value="price">Najtańsze</option><option value="availability">Najwięcej miejsc</option></select></label></div>
        {error && <p className="notice error" role="alert">Błąd pobierania danych: {error}</p>}
        {!loading && !error && filteredParkings.length === 0 && <div className="empty-state"><Icon name="search" size={34}/><h3>Nie znaleźliśmy parkingów</h3><p>Spróbuj wpisać „Wrocław” lub nazwę dzielnicy.</p></div>}
        <div className="parking-grid">{filteredParkings.map((parking) => <ParkingCard key={parking.id} parking={parking} freeSpots={remaining(parking)} onBook={setSelectedParking}/>)}</div>
        <aside className="info-strip"><div className="info-icon"><Icon name="shield" size={23}/></div><div><strong>Środowisko demonstracyjne – Blok 4</strong><p>Parkingi, ceny i dostępność są fikcyjne. Rezerwacje są zapisywane wyłącznie w tej przeglądarce; backend AWS i e-maile nie są jeszcze podłączone.</p></div><span className="info-tag">MOCK DATA</span></aside>
      </main>
    </>}
    {view === 'reservations' && <main className="main-container secondary-main"><div className="secondary-header"><div className="section-overline">TWOJE MIEJSCA</div><h1>Moje rezerwacje</h1><p>Testowe rezerwacje przechowywane w przeglądarce (localStorage).</p></div>{toast && <div className="success-toast"><Icon name="check" size={18}/>{toast}</div>}{reservations.length === 0 ? <div className="empty-state"><Icon name="ticket" size={36}/><h3>Nie masz jeszcze rezerwacji</h3><p>Wybierz parking, aby utworzyć pierwszą rezerwację demonstracyjną.</p><button className="primary-button" onClick={() => setView('search')}>Znajdź parking <Icon name="arrow" size={18}/></button></div> : <div className="reservations-list">{reservations.map((r) => <article className="reservation-row" key={r.id}><span className="reservation-icon"><Icon name="car" size={24}/></span><div className="reservation-detail"><h3>{r.parkingName} <span className={`booking-badge ${r.status === 'active' ? '' : 'booking-badge--cancelled'}`}>{r.status === 'active' ? 'Aktywna · demo' : 'Anulowana'}</span></h3><p>{r.address}</p><small>{dateLabel(r.from)} — {dateLabel(r.to)} · {r.id}</small></div><div className="reservation-actions"><strong>{currency.format(r.price)}</strong>{r.status === 'active' && <button onClick={() => cancelReservation(r.id)}>Anuluj</button>}</div></article>)}</div>}</main>}
    {view === 'admin' && <main className="main-container secondary-main"><div className="secondary-header"><div className="section-overline">PANEL ADMINISTRATORA · WIDOK DEMO</div><h1>Zarządzanie parkingami</h1><p>Podgląd obiektów na podstawie danych z lokalnego pliku JSON. Edycja będzie wymagać API oraz logowania.</p></div><div className="admin-stats"><div><span>Parkingi</span><strong>{parkings.length}</strong></div><div><span>Łączna liczba miejsc</span><strong>{parkings.reduce((sum,p) => sum + p.totalSpots, 0)}</strong></div><div><span>Wolne miejsca (mock)</span><strong>{parkings.reduce((sum,p) => sum + p.availableSpots, 0)}</strong></div></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Parking</th><th>Miasto</th><th>Wszystkie miejsca</th><th>Wolne (mock)</th><th>Stawka</th></tr></thead><tbody>{parkings.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><small>{p.id}</small></td><td>{p.city}</td><td>{p.totalSpots}</td><td>{p.availableSpots}</td><td>{currency.format(p.pricePerHour)}/h</td></tr>)}</tbody></table></div><p className="admin-disclaimer"><Icon name="info" size={18}/> Zarządzanie parkingami, logowanie i trwałe dane nie należą do funkcjonalnego zakresu Bloku 4.</p></main>}
    <footer className="site-footer"><div className="footer-inner"><span>© 2026 ParkFlow · Projekt zespołowy</span><span>React + Vite <span className="footer-separator">•</span> AWS – architektura docelowa <span className="footer-separator">•</span> {useMockApi ? 'Tryb MOCK' : 'Tryb API'}</span></div></footer>
    <ReservationModal parking={selectedParking} from={startDate} to={endDate} onClose={() => setSelectedParking(null)} onConfirm={confirmReservation}/>
  </div>;
}

export default App;
