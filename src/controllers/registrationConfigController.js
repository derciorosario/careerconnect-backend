'use strict';
const { RegistrationConfig, AuditLog } = require('../models');
const { DEFAULT_REGISTRATION_CONFIG } = require('../utils/registrationDefaults');

const getRegistrationConfig = async (req, res) => {
  try {
    const config = await RegistrationConfig.findOne({ order: [['created_at', 'DESC']] });
    res.json(config ? config : DEFAULT_REGISTRATION_CONFIG);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRegistrationConfig = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { areas, goals, obstacles, support_types, levels } = req.body;

    const data = {
      areas: Array.isArray(areas) ? areas : DEFAULT_REGISTRATION_CONFIG.areas,
      goals: Array.isArray(goals) ? goals : DEFAULT_REGISTRATION_CONFIG.goals,
      obstacles: Array.isArray(obstacles) ? obstacles : DEFAULT_REGISTRATION_CONFIG.obstacles,
      support_types: Array.isArray(support_types) ? support_types : DEFAULT_REGISTRATION_CONFIG.support_types,
      levels: Array.isArray(levels) ? levels : DEFAULT_REGISTRATION_CONFIG.levels,
    };

    let config = await RegistrationConfig.findOne({ order: [['created_at', 'DESC']] });
    if (config) {
      Object.assign(config, data);
      await config.save();
    } else {
      config = await RegistrationConfig.create(data);
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_registration_config',
      entity: 'RegistrationConfig',
      entity_id: config.id,
    });

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRegistrationConfig, updateRegistrationConfig };