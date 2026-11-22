CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NULL,

    parking_spot_id VARCHAR(20) NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,

    end_time TIMESTAMPTZ NOT NULL,

    price NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (price >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_reservation_time
        CHECK (end_time > start_time)
);

-- Indeks przyspieszający wyszukiwanie rezerwacji użytkownika
CREATE INDEX IF NOT EXISTS idx_reservations_user_id
    ON reservations(user_id);

-- Indeks przyspieszający wyszukiwanie rezerwacji parkingu
CREATE INDEX IF NOT EXISTS idx_reservations_parking_spot_id
    ON reservations(parking_spot_id);