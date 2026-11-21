
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NULL,

    parking_id VARCHAR(20) NOT NULL,

    reservation_from TIMESTAMPTZ NOT NULL,

    reservation_to TIMESTAMPTZ NOT NULL,

    price NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (price >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_reservation_time
        CHECK (reservation_to > reservation_from)
);

-- Indeks przyspieszający wyszukiwanie rezerwacji użytkownika
CREATE INDEX IF NOT EXISTS idx_reservations_user_id
    ON reservations(user_id);

-- Indeks przyspieszający wyszukiwanie rezerwacji parkingu
CREATE INDEX IF NOT EXISTS idx_reservations_parking_id
    ON reservations(parking_id);
