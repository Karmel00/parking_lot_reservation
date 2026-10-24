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

export { useMockApi };
