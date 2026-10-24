import React from 'react';

const paths = {
  car: <><path d="m5 17-1.2 1.2M19 17l1.2 1.2M5 10l1.2-4a2 2 0 0 1 1.9-1.4h7.8A2 2 0 0 1 17.8 6l1.2 4"/><path d="M4 10h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z"/><path d="M7 14h.01M17 14h.01"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  ticket: <><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4Z"/><path strokeDasharray="2 3" d="M12 6v12"/></>,
  sparkles: <><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2ZM19 15l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z"/></>,
  close: <path d="M5 5 19 19M19 5 5 19"/>,
  building: <><rect x="4" y="3" width="16" height="19" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 22v-4h4v4"/></>,
  info: <><circle cx="12" cy="12" r="10"/><path d="M12 11v5M12 7h.01"/></>,
  filter: <><path d="M4 7h16M7 12h10M10 17h4"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>,
};

export default function Icon({ name, size = 20, className = '' }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.info}</svg>;
}
