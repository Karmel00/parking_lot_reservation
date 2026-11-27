const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const reservationRoutes = require('./routes/reservations');

const app = express();

// Zezwalamy na komunikację z lokalnym frontendem Vite
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.use('/api/reservations', reservationRoutes);

// Kontrolny endpoint aplikacji i bazy danych
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.status(200).json({
            status: 'UP',
            service: 'reservation-service',
            database: 'CONNECTED',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error.message);

        res.status(500).json({
            status: 'DOWN',
            service: 'reservation-service',
            database: 'DISCONNECTED',
            timestamp: new Date().toISOString()
        });
    }
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