const pool = require('../config/database');

// Formatuje dane z bazy do formatu oczekiwanego przez frontend
const formatReservation = (row) => ({
    id: `PF-${row.id}`,
    user_id: row.user_id,
    parkingId: String(row.parking_spot_id),
    parking_spot_id: String(row.parking_spot_id),
    from: row.start_time,
    to: row.end_time,
    price: Number(row.price),
    status: row.status
});

// Walidacja wspólna dla danych rezerwacji
const validateReservation = (data) => {
    const {
        user_id,
        parking_spot_id,
        start_time,
        end_time,
        price = 0
    } = data;

    return (
        (user_id == null ||
            (Number.isInteger(Number(user_id)) && Number(user_id) > 0)) &&
        typeof parking_spot_id === 'string' &&
        parking_spot_id.trim().length > 0 &&
        parking_spot_id.length <= 10 &&
        typeof start_time === 'string' &&
        typeof end_time === 'string' &&
        !Number.isNaN(Date.parse(start_time)) &&
        !Number.isNaN(Date.parse(end_time)) &&
        new Date(end_time) > new Date(start_time) &&
        Number.isFinite(Number(price)) &&
        Number(price) >= 0
    );
};

// Obsługa identyfikatora PF-123 lub 123
const parseReservationId = (value) => {
    const id = Number(String(value).replace(/^PF-/, ''));

    return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/reservations
const getReservations = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM reservations ORDER BY id ASC'
        );

        res.status(200).json(result.rows.map(formatReservation));
    } catch (error) {
        console.error('Get reservations error:', error.message);
        res.status(500).json({
            error: 'Nie udało się pobrać rezerwacji.'
        });
    }
};

// GET /api/reservations/available-spots
const getAvailableSpots = async (req, res) => {
    try {
        const { parking_id, start_time, end_time } = req.query;

        if (
            typeof parking_id !== 'string' ||
            !parking_id.trim() ||
            typeof start_time !== 'string' ||
            typeof end_time !== 'string' ||
            Number.isNaN(Date.parse(start_time)) ||
            Number.isNaN(Date.parse(end_time)) ||
            new Date(end_time) <= new Date(start_time)
        ) {
            return res.status(400).json({
                error: 'Invalid parking ID or reservation time.'
            });
        }

        const result = await pool.query(
            `SELECT
                ps.id,
                ps.parking_id,
                ps.spot_number,
                ps.spot_code,
                ps.status
             FROM parking_spots ps
             WHERE ps.parking_id = $1
               AND ps.status = 'active'
               AND NOT EXISTS (
                   SELECT 1
                   FROM reservations r
                   WHERE r.parking_spot_id = ps.spot_code
                     AND r.status = 'active'
                     AND r.start_time < $3
                     AND r.end_time > $2
               )
             ORDER BY ps.spot_number ASC`,
            [parking_id, start_time, end_time]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get available spots error:', error.message);
        res.status(500).json({
            error: 'Nie udało się pobrać wolnych miejsc.'
        });
    }
};

// GET /api/reservations/:id
const getReservationById = async (req, res) => {
    try {
        const id = parseReservationId(req.params.id);

        if (!id) {
            return res.status(400).json({
                error: 'Invalid reservation ID'
            });
        }

        const result = await pool.query(
            'SELECT * FROM reservations WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Reservation not found'
            });
        }

        res.status(200).json(formatReservation(result.rows[0]));
    } catch (error) {
        console.error('Get reservation error:', error.message);
        res.status(500).json({
            error: 'Nie udało się pobrać rezerwacji.'
        });
    }
};

// POST /api/reservations
const createReservation = async (req, res) => {
    try {
        const {
            user_id,
            parking_spot_id,
            start_time,
            end_time,
            price = 0
        } = req.body;

        if (!validateReservation(req.body)) {
            return res.status(400).json({
                error: 'Invalid reservation data'
            });
        }

        const result = await pool.query(
            `INSERT INTO reservations
                (user_id, parking_spot_id, start_time, end_time, price)
             SELECT $1, ps.spot_code, $3, $4, $5
             FROM parking_spots ps
             WHERE ps.spot_code = $2
               AND ps.status = 'active'
             RETURNING *`,
            [
                user_id ?? null,
                parking_spot_id.trim(),
                start_time,
                end_time,
                Number(price)
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Parking spot not found or unavailable.'
            });
        }

        res.status(201).json(formatReservation(result.rows[0]));
    } catch (error) {
        if (error.code === '23P01') {
            return res.status(409).json({
                error: 'This parking spot is already reserved for the selected time.'
            });
        }

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Invalid user or parking spot.'
            });
        }

        console.error('Create reservation error:', error.message);
        res.status(500).json({
            error: 'Nie udało się utworzyć rezerwacji.'
        });
    }
};

// PUT /api/reservations/:id
const updateReservation = async (req, res) => {
    try {
        const id = parseReservationId(req.params.id);

        if (!id) {
            return res.status(400).json({
                error: 'Invalid reservation ID'
            });
        }

        const {
            user_id,
            parking_spot_id,
            start_time,
            end_time,
            price = 0,
            status
        } = req.body;

        if (
            !validateReservation(req.body) ||
            !['active', 'cancelled'].includes(status)
        ) {
            return res.status(400).json({
                error: 'Invalid reservation data'
            });
        }

        const result = await pool.query(
            `UPDATE reservations r
             SET user_id = $1,
                 parking_spot_id = ps.spot_code,
                 start_time = $3,
                 end_time = $4,
                 price = $5,
                 status = $6
             FROM parking_spots ps
             WHERE r.id = $7
               AND ps.spot_code = $2
               AND ($6 = 'cancelled' OR ps.status = 'active')
             RETURNING r.*`,
            [
                user_id ?? null,
                parking_spot_id.trim(),
                start_time,
                end_time,
                Number(price),
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Reservation or active parking spot not found.'
            });
        }

        res.status(200).json(formatReservation(result.rows[0]));
    } catch (error) {
        if (error.code === '23P01') {
            return res.status(409).json({
                error: 'This parking spot is already reserved for the selected time.'
            });
        }

        console.error('Update reservation error:', error.message);
        res.status(500).json({
            error: 'Nie udało się zaktualizować rezerwacji.'
        });
    }
};

// DELETE /api/reservations/:id
const deleteReservation = async (req, res) => {
    try {
        const id = parseReservationId(req.params.id);

        if (!id) {
            return res.status(400).json({
                error: 'Invalid reservation ID'
            });
        }

        const result = await pool.query(
            'DELETE FROM reservations WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Reservation not found'
            });
        }

        res.status(200).json({
            message: 'Reservation deleted successfully',
            reservation: formatReservation(result.rows[0])
        });
    } catch (error) {
        console.error('Delete reservation error:', error.message);
        res.status(500).json({
            error: 'Nie udało się usunąć rezerwacji.'
        });
    }
};

module.exports = {
    getReservations,
    getAvailableSpots,
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation
};