'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NextStep = sequelize.define('NextStep', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  due_date: { type: DataTypes.DATE, allowNull: false },
  reminded_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = NextStep;
