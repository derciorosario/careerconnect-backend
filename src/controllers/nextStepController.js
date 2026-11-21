'use strict';
const { NextStep, AuditLog } = require('../models');

const createNextStep = async (req, res) => {
  try {
    const { text, due_date } = req.body;
    const userId = req.userId;

    const existing = await NextStep.findOne({ where: { user_id: userId } });
    if (existing) {
      existing.text = text;
      existing.due_date = due_date;
      existing.reminded_at = null;
      await existing.save();
      return res.json({ nextStep: existing });
    }

    const nextStep = await NextStep.create({
      user_id: userId,
      text,
      due_date,
    });

    await AuditLog.create({
      actor_id: userId,
      action: 'create_next_step',
      entity: 'NextStep',
      entity_id: nextStep.id,
    });

    res.status(201).json({ nextStep });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyNextStep = async (req, res) => {
  try {
    const userId = req.userId;
    const nextStep = await NextStep.findOne({ where: { user_id: userId } });
    res.json({ nextStep });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createNextStep, getMyNextStep };
