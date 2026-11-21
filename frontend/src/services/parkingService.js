import mockParkings from '../data/parkings.json';

// W Bloku 4 dane pochodzą z pliku JSON (E3).
// W kolejnych blokach wystarczy ustawić VITE_USE_MOCK_API=false i uruchomić API.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false';

export async function getParkings() {
  if (useMockApi) {
    return Promise.resolve(mockParkings);
  }

  if (!apiBaseUrl) {
    throw new Error('Brak VITE_API_BASE_URL. Skonfiguruj plik .env.');
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/parkings`);
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać parkingów (HTTP ${response.status}).`);
  }
  return response.json();
}

// Zapis rezerwacji w bazie przez API (Blok 9, Test 3).
// Bez VITE_API_BASE_URL rezerwacja zostaje tylko w przeglądarce.
export async function saveReservation({ parkingId, from, to }) {
  if (!apiBaseUrl) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1, // użytkownik demonstracyjny (brak logowania)
      parking_spot_id: Number(String(parkingId).replace(/\D/g, '')),
      start_time: new Date(from).toISOString(),
      end_time: new Date(to).toISOString()
    })
  });
  if (!response.ok) {
    throw new Error(`Nie udało się zapisać rezerwacji (HTTP ${response.status}).`);
  }
  return response.json();
}

export { useMockApi };