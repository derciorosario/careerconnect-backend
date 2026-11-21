'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Session = sequelize.define('Session', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  order: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('masterclass', 'break', 'coffee'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  challenge: { type: DataTypes.TEXT },
  starts_at: { type: DataTypes.DATE },
  speaker_id: { type: DataTypes.UUID },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Session;
