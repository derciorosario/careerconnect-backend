'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Badge = sequelize.define('Badge', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  earned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: false,
});

module.exports = Badge;
