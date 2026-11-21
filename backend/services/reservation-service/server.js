require('dotenv').config();

const fs = require('fs');
const path = require('path');
const app = require('./app');
const pool = require('./config/database');

const PORT = process.env.PORT || 8080;

// Tworzy tabele, jeśli ich nie ma (schema.sql używa CREATE ... IF NOT EXISTS)
async function initSchema() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('Database schema ready');
    } catch (error) {
        console.error('Database schema init failed:', error.message);
    }
}

initSchema().finally(() => {
    app.listen(PORT, () => {
        console.log(`Reservation service running on port ${PORT}`);
    });
});