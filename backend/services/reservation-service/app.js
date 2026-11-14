const express = require('express');
const pool = require('./config/database');
const reservationRoutes = require('./routes/reservations');

const app = express();
app.use(express.json());

app.use('/api/reservations', reservationRoutes);

// Kontrolny endpoint aplikacji
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'reservation-service',
        message: 'Reservation service is running'
    });
});

// Kontrolny endpoint połączenia z bazą
app.get('/health/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS database_time');

        res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].database_time
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);

        res.status(503).json({
            status: 'error',
            database: 'unavailable',
            message: 'Database connection failed'
        });
    }
});

module.exports = app;