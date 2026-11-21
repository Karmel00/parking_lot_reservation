const pool = require('../config/database');

// Formatuje identyfikator bazy na format zgodny z frontendem
const formatReservation = (row) => ({
    id: `PF-${row.id}`,
    user_id: row.user_id,
    parkingId: row.parking_id,
    from: row.reservation_from,
    to: row.reservation_to,
    price: Number(row.price),
    status: row.status
});

// GET /api/reservations
const getReservations = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM reservations ORDER BY id ASC'
        );

        res.status(200).json(result.rows.map(formatReservation));
    } catch (error) {
        console.error('Get reservations error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/reservations/:id
const getReservationById = async (req, res) => {
    try {
        const id = Number(String(req.params.id).replace(/^PF-/, ''));

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid reservation ID' });
        }

        const result = await pool.query(
            'SELECT * FROM reservations WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.status(200).json(formatReservation(result.rows[0]));
    } catch (error) {
        console.error('Get reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/reservations
const createReservation = async (req, res) => {
    try {
        const { parkingId, from, to, price = 0 } = req.body;

        if (
            typeof parkingId !== 'string' ||
            !/^P\d{3,}$/.test(parkingId) ||
            !from ||
            !to ||
            Number.isNaN(Date.parse(from)) ||
            Number.isNaN(Date.parse(to)) ||
            new Date(to) <= new Date(from) ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({ error: 'Invalid reservation data' });
        }

        const result = await pool.query(
            `INSERT INTO reservations
                (parking_id, reservation_from, reservation_to, price)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [parkingId, from, to, Number(price)]
        );

        res.status(201).json(formatReservation(result.rows[0]));
    } catch (error) {
        console.error('Create reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/reservations/:id
const updateReservation = async (req, res) => {
    try {
        const id = Number(String(req.params.id).replace(/^PF-/, ''));

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid reservation ID' });
        }

        const { parkingId, from, to, price = 0, status } = req.body;
        const validStatuses = ['active', 'cancelled'];

        if (
            typeof parkingId !== 'string' ||
            !/^P\d{3,}$/.test(parkingId) ||
            !from ||
            !to ||
            Number.isNaN(Date.parse(from)) ||
            Number.isNaN(Date.parse(to)) ||
            new Date(to) <= new Date(from) ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({ error: 'Invalid reservation data' });
        }

        const result = await pool.query(
            `UPDATE reservations
             SET parking_id = $1,
                 reservation_from = $2,
                 reservation_to = $3,
                 price = $4,
                 status = $5
             WHERE id = $6
             RETURNING *`,
            [parkingId, from, to, Number(price), status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.status(200).json(formatReservation(result.rows[0]));
    } catch (error) {
        console.error('Update reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/reservations/:id
const deleteReservation = async (req, res) => {
    try {
        const id = Number(String(req.params.id).replace(/^PF-/, ''));

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid reservation ID' });
        }

        const result = await pool.query(
            'DELETE FROM reservations WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.status(200).json({
            message: 'Reservation deleted successfully',
            reservation: formatReservation(result.rows[0])
        });
    } catch (error) {
        console.error('Delete reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getReservations,
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation
};