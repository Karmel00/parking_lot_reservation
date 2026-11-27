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

// Pobieranie wolnych miejsc dla parkingu i wybranego terminu
export async function getAvailableSpots({ parkingId, from, to }) {
  const params = new URLSearchParams({
    parking_id: parkingId,
    start_time: new Date(from).toISOString(),
    end_time: new Date(to).toISOString()
  });

  const response = await fetch(
    getApiUrl(`reservations/available-spots?${params}`)
  );

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać wolnych miejsc (HTTP ${response.status}).`);
  }

  return response.json();
}

// Tworzenie rezerwacji konkretnego miejsca, np. P001
export async function saveReservation({ parkingSpotId, from, to }) {
  if (
    typeof parkingSpotId !== 'string' ||
    !/^[A-Z][A-Z0-9]*\d{3}$/.test(parkingSpotId)
  ) {
    throw new Error('Nieprawidłowy kod miejsca parkingowego.');
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
    if (response.status === 409) {
      throw new Error('Wybrane miejsce zostało już zarezerwowane w tym terminie.');
    }

    throw new Error(`Nie udało się zapisać rezerwacji (HTTP ${response.status}).`);
  }

  return response.json();
}

// Anulowanie rezerwacji przez zmianę statusu na cancelled
export async function cancelReservation(reservation) {
  const reservationId = String(reservation.id).replace(/^PF-/, '');
  const parkingSpotId = reservation.parking_spot_id ?? reservation.parkingId;

  if (!/^\d+$/.test(reservationId) || Number(reservationId) <= 0) {
    throw new Error('Nieprawidłowy identyfikator rezerwacji.');
  }

  if (
    typeof parkingSpotId !== 'string' ||
    !/^[A-Z][A-Z0-9]*\d{3}$/.test(parkingSpotId)
  ) {
    throw new Error('Nieprawidłowy kod miejsca parkingowego.');
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
        price: reservation.price ?? 0,
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