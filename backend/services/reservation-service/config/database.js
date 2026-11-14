const { Pool } = require('pg');

// Sprawdzenie wymaganych zmiennych środowiskowych
const requiredVariables = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
];

const missingVariables = requiredVariables.filter(
    variable => !process.env[variable]
);

if (missingVariables.length > 0) {
    throw new Error(
        `Missing database configuration: ${missingVariables.join(', ')}`
    );
}

// Pula połączeń PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Obsługa błędów połączeń
pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;