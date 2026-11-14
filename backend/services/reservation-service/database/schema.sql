CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    parking_spot_id INTEGER NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,

    end_time TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_reservation_time
        CHECK (end_time > start_time)
);

-- Indeksy przyspieszające wyszukiwanie rezerwacji
CREATE INDEX IF NOT EXISTS idx_reservations_user_id
    ON reservations(user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_parking_spot_id
    ON reservations(parking_spot_id);