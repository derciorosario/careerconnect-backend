'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Announcement = sequelize.define('Announcement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  sent_by: { type: DataTypes.UUID },
  sent_at: { type: DataTypes.DATE },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Announcement;
