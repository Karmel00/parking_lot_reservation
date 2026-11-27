// E2: kluczowa ścieżka użytkownika - rezerwacja miejsca parkingowego
const { test, expect } = require('@playwright/test');

test('Użytkownik rezerwuje miejsce i widzi je w „Moje rezerwacje”', async ({ page, request }) => {
  let reservationId;

  try {
    // 1. Otwarcie aplikacji w chmurze
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Dostępne miejsca/ })).toBeVisible();

    // 2. Wybór pierwszego parkingu z wolnymi miejscami (selektory po etykietach)
    await page.getByRole('button', { name: 'Rezerwuj', disabled: false }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 3. Potwierdzenie rezerwacji w formularzu
    await page.getByRole('button', { name: /Potwierdź rezerwację/ }).click();

    // 4. Rezerwacja zapisana w bazie (komunikat z numerem z API)
    const toast = page.getByText(/Rezerwacja zapisana w bazie danych \(nr \d+\)/);
    await expect(toast).toBeVisible();
    reservationId = (await toast.textContent()).match(/nr (\d+)/)[1];

    // 5. Rezerwacja widoczna na liście „Moje rezerwacje”
    await expect(page.getByRole('heading', { name: 'Moje rezerwacje' })).toBeVisible();
    await expect(page.getByText(`DB-${reservationId}`)).toBeVisible();
  } finally {
    // Sprzątanie: usunięcie rezerwacji testowej z bazy produkcyjnej
    if (reservationId) {
      const response = await request.delete(`/api/reservations/${reservationId}`);
      expect(response.status()).toBe(200);
    }
  }
});
