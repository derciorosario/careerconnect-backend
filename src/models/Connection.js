'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Connection = sequelize.define('Connection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_a: { type: DataTypes.UUID, allowNull: false },
  user_b: { type: DataTypes.UUID, allowNull: false },
  origin: { type: DataTypes.ENUM('mutual', 'code_swap', 'mentorship'), defaultValue: 'mutual' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['user_a', 'user_b'] },
  ],
});

module.exports = Connection;
