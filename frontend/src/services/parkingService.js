import mockParkings from '../data/parkings.json';

// Konfiguracja API
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false';

const getApiUrl = (endpoint) => {
  if (!apiBaseUrl) {
    throw new Error('Brak VITE_API_BASE_URL. Skonfiguruj plik .env.');
  }

  return `${apiBaseUrl.replace(/\/$/, '')}/${endpoint}`;
};

// Pobieranie parkingów
export async function getParkings() {
  if (useMockApi) {
    return Promise.resolve(mockParkings);
  }

  const response = await fetch(getApiUrl('parkings'));

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać parkingów (HTTP ${response.status}).`);
  }

  return response.json();
}

// Pobieranie wszystkich rezerwacji
export async function getReservations() {
  const response = await fetch(getApiUrl('reservations'));

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać rezerwacji (HTTP ${response.status}).`);
  }

  return response.json();
}

// Tworzenie rezerwacji
export async function saveReservation({ parkingId, from, to }) {
  const parkingSpotId = Number(String(parkingId).replace(/\D/g, ''));

  if (!Number.isInteger(parkingSpotId) || parkingSpotId <= 0) {
    throw new Error('Nieprawidłowy identyfikator miejsca parkingowego.');
  }

  const response = await fetch(getApiUrl('reservations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1,
      parking_spot_id: parkingSpotId,
      start_time: new Date(from).toISOString(),
      end_time: new Date(to).toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Nie udało się zapisać rezerwacji (HTTP ${response.status}).`);
  }

  return response.json();
}

// Anulowanie rezerwacji przez zmianę statusu na cancelled
export async function cancelReservation(reservation) {
  const reservationId = String(reservation.id).replace(/^PF-/, '');
  const parkingSpotId = Number(
    String(reservation.parkingId).replace(/\D/g, '')
  );

  if (!Number.isInteger(Number(reservationId)) || Number(reservationId) <= 0) {
    throw new Error('Nieprawidłowy identyfikator rezerwacji.');
  }

  if (!Number.isInteger(parkingSpotId) || parkingSpotId <= 0) {
    throw new Error('Nieprawidłowy identyfikator miejsca parkingowego.');
  }

  const response = await fetch(
    getApiUrl(`reservations/${reservationId}`),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: reservation.user_id ?? null,
        parking_spot_id: parkingSpotId,
        start_time: new Date(reservation.from).toISOString(),
        end_time: new Date(reservation.to).toISOString(),
        status: 'cancelled'
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Nie udało się anulować rezerwacji (HTTP ${response.status}).`);
  }

  return response.json();
}

export { useMockApi };