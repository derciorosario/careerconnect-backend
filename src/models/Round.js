'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Round = sequelize.define('Round', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  break_no: { type: DataTypes.INTEGER, allowNull: false },
  round_no: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('planned', 'running', 'paused', 'done'), defaultValue: 'planned' },
  started_at: { type: DataTypes.DATE },
  ends_at: { type: DataTypes.DATE },
  paused_remaining: { type: DataTypes.INTEGER },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Round;
