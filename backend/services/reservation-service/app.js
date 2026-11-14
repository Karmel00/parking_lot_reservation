const express = require('express');

const app = express();

// Obsługa danych JSON
app.use(express.json());

// Endpoint kontrolny
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'reservation-service',
        message: 'Reservation service is running'
    });
});

module.exports = app;