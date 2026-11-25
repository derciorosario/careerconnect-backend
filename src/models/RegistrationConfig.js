'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RegistrationConfig = sequelize.define('RegistrationConfig', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  areas: { type: DataTypes.JSON, allowNull: false },
  goals: { type: DataTypes.JSON, allowNull: false },
  obstacles: { type: DataTypes.JSON, allowNull: false },
  support_types: { type: DataTypes.JSON, allowNull: false },
  levels: { type: DataTypes.JSON, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RegistrationConfig;