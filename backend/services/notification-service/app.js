const express = require('express');

const app = express();

app.use(express.json());

// Endpoint kontrolny
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'notification-service',
        message: 'Notification service is running'
    });
});

module.exports = app;