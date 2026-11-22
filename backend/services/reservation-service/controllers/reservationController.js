const pool = require('../config/database');

// Formatuje dane z bazy do formatu oczekiwanego przez frontend
const formatReservation = (row) => ({
    id: `PF-${row.id}`,
    user_id: row.user_id,
    parkingId: String(row.parking_spot_id),
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
        (user_id === null ||
            (Number.isInteger(Number(user_id)) && Number(user_id) > 0)) &&
        Number.isInteger(Number(parking_spot_id)) &&
        Number(parking_spot_id) > 0 &&
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
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                user_id ?? null,
                String(parking_spot_id),
                start_time,
                end_time,
                Number(price)
            ]
        );

        res.status(201).json(formatReservation(result.rows[0]));
    } catch (error) {
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
            `UPDATE reservations
             SET user_id = $1,
                 parking_spot_id = $2,
                 start_time = $3,
                 end_time = $4,
                 price = $5,
                 status = $6
             WHERE id = $7
             RETURNING *`,
            [
                user_id ?? null,
                String(parking_spot_id),
                start_time,
                end_time,
                Number(price),
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Reservation not found'
            });
        }

        res.status(200).json(formatReservation(result.rows[0]));
    } catch (error) {
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
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation
};