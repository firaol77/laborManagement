const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('labor_management', 'postgres', 'your_password', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres'
});

sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));