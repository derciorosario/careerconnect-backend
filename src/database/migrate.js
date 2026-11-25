'use strict';
const { Sequelize } = require('sequelize');
require('dotenv').config();

(async () => {
  // Connect without specifying a database to create it
  const admin = new Sequelize(
    'mysql',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      dialectModule: require('mysql2'),
      logging: false,
    }
  );

  try {
    await admin.authenticate();
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'career_connect'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${process.env.DB_NAME || 'career_connect'}' ready.`);
  } catch (e) {
    console.error('Failed to create database:', e.message);
    process.exit(1);
  } finally {
    await admin.close();
  }

  // Now sync models using the configured database
  const { sequelize } = require('../config/db');
  require('../models'); // register all models on the sequelize instance

  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await sequelize.sync({ alter: true });
    console.log('All models synchronized successfully.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
