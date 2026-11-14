require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Reservation service running on port ${PORT}`);
});