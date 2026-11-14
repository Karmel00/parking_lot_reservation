const pool = require('../config/database');

// GET /reservations – lista rezerwacji
const getReservations = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM reservations ORDER BY id ASC'
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get reservations error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /reservations/:id – szczegóły rezerwacji
const getReservationById = async (req, res) => {
    try {
        const id = Number(req.params.id);

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

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Get reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /reservations – utworzenie rezerwacji
const createReservation = async (req, res) => {
    try {
        const { user_id, parking_spot_id, start_time, end_time } = req.body;

        if (
            !Number.isInteger(user_id) || user_id <= 0 ||
            !Number.isInteger(parking_spot_id) || parking_spot_id <= 0 ||
            !start_time || !end_time ||
            Number.isNaN(Date.parse(start_time)) ||
            Number.isNaN(Date.parse(end_time)) ||
            new Date(end_time) <= new Date(start_time)
        ) {
            return res.status(400).json({ error: 'Invalid reservation data' });
        }

        const result = await pool.query(
            `INSERT INTO reservations
            (user_id, parking_spot_id, start_time, end_time)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [user_id, parking_spot_id, start_time, end_time]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /reservations/:id – aktualizacja rezerwacji
const updateReservation = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid reservation ID' });
        }

        const { user_id, parking_spot_id, start_time, end_time, status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled'];

        if (
            !Number.isInteger(user_id) || user_id <= 0 ||
            !Number.isInteger(parking_spot_id) || parking_spot_id <= 0 ||
            !start_time || !end_time ||
            Number.isNaN(Date.parse(start_time)) ||
            Number.isNaN(Date.parse(end_time)) ||
            new Date(end_time) <= new Date(start_time) ||
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({ error: 'Invalid reservation data' });
        }

        const result = await pool.query(
            `UPDATE reservations
            SET user_id = $1,
                parking_spot_id = $2,
                start_time = $3,
                end_time = $4,
                status = $5
            WHERE id = $6
            RETURNING *`,
            [user_id, parking_spot_id, start_time, end_time, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Update reservation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /reservations/:id – usunięcie rezerwacji
const deleteReservation = async (req, res) => {
    try {
        const id = Number(req.params.id);

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
            reservation: result.rows[0]
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