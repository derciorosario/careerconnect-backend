'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Questionnaire = sequelize.define('Questionnaire', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: true },
  content: { type: DataTypes.JSON, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Questionnaire;