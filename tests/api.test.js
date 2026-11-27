// E1: testy integracyjne REST API na działającej aplikacji (lokalnie lub w chmurze)
const request = require('supertest');

// Adres całej aplikacji (CloudFront albo lokalna bramka nginx), bez końcowego "/"
const API_URL = (process.env.LIVE_APP_URL || 'http://localhost').replace(/\/$/, '');

// Rezerwacja testowa z unikalnym czasem, żeby łatwo ją rozpoznać w bazie
const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
const newReservation = {
  user_id: 1,
  parking_spot_id: 1,
  start_time: start.toISOString(),
  end_time: end.toISOString()
};

let createdId;

describe('Endpoint /api/health', () => {
  it('zwraca 200 i JSON ze stanem serwisu', async () => {
    const response = await request(API_URL)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.service).toBe('reservation-service');
    // 'UP' po zmianie z Bloku 10, 'ok' w starszej wersji serwisu
    expect(['UP', 'ok']).toContain(response.body.status);
  });
});

describe('Integracja REST API - /api/reservations', () => {
  it('pobiera listę rezerwacji ze statusem 200 OK', async () => {
    const response = await request(API_URL)
      .get('/api/reservations')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('tworzy nową rezerwację ze statusem 201 Created', async () => {
    const response = await request(API_URL)
      .post('/api/reservations')
      .send(newReservation)
      .expect('Content-Type', /json/)
      .expect(201);

    createdId = response.body.id;

    expect(typeof response.body.id).toBe('number');
    expect(response.body.user_id).toBe(newReservation.user_id);
    expect(response.body.parking_spot_id).toBe(newReservation.parking_spot_id);
    expect(new Date(response.body.start_time).toISOString()).toBe(newReservation.start_time);
    expect(response.body.status).toBe('pending');
  });

  it('zwraca utworzoną rezerwację po id', async () => {
    const response = await request(API_URL)
      .get(`/api/reservations/${createdId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).toBe(createdId);
  });

  it('odrzuca niepełne dane statusem 400', async () => {
    const response = await request(API_URL)
      .post('/api/reservations')
      .send({ user_id: 1 })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('zwraca 404 dla nieistniejącej rezerwacji', async () => {
    await request(API_URL)
      .get('/api/reservations/999999999')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

// Sprzątanie: rezerwacja testowa nie zostaje w bazie produkcyjnej
afterAll(async () => {
  if (createdId) {
    await request(API_URL).delete(`/api/reservations/${createdId}`).expect(200);
  }
});
