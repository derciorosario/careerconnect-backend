'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Registration = sequelize.define('Registration', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  ticket_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  qr_payload: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('registered', 'present', 'cancelled'), defaultValue: 'registered' },
  checked_in_at: { type: DataTypes.DATE },
  checked_in_by: { type: DataTypes.UUID },
  walk_in: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Registration;
