'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Wish = sequelize.define('Wish', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mentee_id: { type: DataTypes.UUID, allowNull: false },
  mentor_id: { type: DataTypes.UUID, allowNull: false },
  event_id: { type: DataTypes.UUID, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Wish;
