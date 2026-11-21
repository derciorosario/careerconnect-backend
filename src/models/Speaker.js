'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Speaker = sequelize.define('Speaker', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING },
  company: { type: DataTypes.STRING },
  photo_url: { type: DataTypes.TEXT },
  topic: { type: DataTypes.STRING },
  bio: { type: DataTypes.TEXT },
  user_id: { type: DataTypes.UUID },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Speaker;
