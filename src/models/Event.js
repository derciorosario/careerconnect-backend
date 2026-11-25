'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  starts_at: { type: DataTypes.DATE, allowNull: false },
  ends_at: { type: DataTypes.DATE, allowNull: false },
  venue: { type: DataTypes.STRING, allowNull: false },
  map_url: { type: DataTypes.TEXT },
  capacity: { type: DataTypes.INTEGER, defaultValue: 100 },
  status: { type: DataTypes.STRING, defaultValue: 'draft' },
  round_minutes: { type: DataTypes.INTEGER, defaultValue: 5 },
  rounds_per_break: { type: DataTypes.INTEGER, defaultValue: 4 },
  max_mentees_per_mentor: { type: DataTypes.INTEGER, defaultValue: 5 },
  warn_seconds: { type: DataTypes.INTEGER, defaultValue: 30 },
  tables_count: { type: DataTypes.INTEGER, defaultValue: 10 },
  floor_plan: { type: DataTypes.TEXT },
  match_weights: { type: DataTypes.JSON, defaultValue: { areas: 45, goal: 20, sector: 10, want: 15, variety: 10 } },
  landing_texts: { type: DataTypes.JSON, defaultValue: {} },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Event;
