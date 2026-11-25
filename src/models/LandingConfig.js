'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LandingConfig = sequelize.define('LandingConfig', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content: { type: DataTypes.JSON, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LandingConfig;