'use strict';
const { SurveyResponse, AuditLog } = require('../models');

const submitSurvey = async (req, res) => {
  try {
    const { event_id, rating, nps, comment } = req.body;
    const userId = req.userId;

    const existing = await SurveyResponse.findOne({ where: { user_id: userId, event_id } });
    if (existing) {
      return res.status(400).json({ message: 'Survey already submitted' });
    }

    const survey = await SurveyResponse.create({
      user_id: userId,
      event_id,
      rating,
      nps,
      comment,
    });

    await AuditLog.create({
      actor_id: userId,
      action: 'submit_survey',
      entity: 'SurveyResponse',
      entity_id: survey.id,
    });

    res.status(201).json({ survey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSurveyResults = async (req, res) => {
  try {
    const { event_id } = req.query;
    const where = event_id ? { event_id } : {};
    
    const surveys = await SurveyResponse.findAll({ where });
    const avgRating = surveys.length > 0 
      ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length 
      : 0;
    const avgNPS = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + (s.nps || 0), 0) / surveys.length
      : 0;

    res.json({ surveys, avgRating, avgNPS, total: surveys.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitSurvey, getSurveyResults };
