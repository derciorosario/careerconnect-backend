'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Poll = sequelize.define('Poll', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_id: { type: DataTypes.UUID, allowNull: false },
  question: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Poll;
