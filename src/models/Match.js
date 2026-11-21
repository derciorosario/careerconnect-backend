'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Match = sequelize.define('Match', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  round_id: { type: DataTypes.UUID, allowNull: false },
  table_no: { type: DataTypes.INTEGER },
  mentor_id: { type: DataTypes.UUID },
  mentee_ids: { type: DataTypes.JSON },
  score: { type: DataTypes.INTEGER },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Match;
