'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SurveyResponse = sequelize.define('SurveyResponse', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  event_id: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  nps: { type: DataTypes.INTEGER },
  comment: { type: DataTypes.TEXT },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SurveyResponse;
