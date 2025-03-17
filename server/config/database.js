const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('labor_management', 'postgres', 'admin123', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432, // Default PostgreSQL port
    logging: false, // Disable logging SQL queries
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;