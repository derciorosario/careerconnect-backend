'use strict';
const { SurveyResponse, Questionnaire, AuditLog, Event, User } = require('../models');
const { Op } = require('sequelize');
const { DEFAULT_QUESTIONNAIRE } = require('../utils/questionnaireDefaults');

const resolveEventId = async (explicit) => {
  if (explicit && explicit !== 'current') return explicit;
  const active = await Event.findOne({
    where: { status: { [Op.notIn]: ['finished', 'closed'] } },
    order: [['starts_at', 'DESC']],
  });
  return active ? active.id : null;
};

const getQuestionnaire = async (req, res) => {
  try {
    const event_id = await resolveEventId(req.query.event_id);
    let questionnaire = null;
    if (event_id) {
      questionnaire = await Questionnaire.findOne({ where: { event_id } });
    }
    if (!questionnaire) {
      questionnaire = await Questionnaire.findOne({ order: [['created_at', 'DESC']] });
    }
    res.json({ content: questionnaire ? questionnaire.content : DEFAULT_QUESTIONNAIRE });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateQuestionnaire = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { content } = req.body;
    if (!content || typeof content !== 'object') {
      return res.status(400).json({ message: 'Conteúdo inválido.' });
    }
    const event_id = await resolveEventId(req.body.event_id);

    let questionnaire = event_id
      ? await Questionnaire.findOne({ where: { event_id } })
      : null;
    if (!questionnaire) {
      questionnaire = await Questionnaire.findOne({ order: [['created_at', 'DESC']] });
    }

    if (questionnaire) {
      questionnaire.content = content;
      if (event_id && !questionnaire.event_id) questionnaire.event_id = event_id;
      await questionnaire.save();
    } else {
      questionnaire = await Questionnaire.create({ event_id, content });
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_questionnaire',
      entity: 'Questionnaire',
      entity_id: questionnaire.id,
    });

    res.json({ content: questionnaire.content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitSurvey = async (req, res) => {
  try {
    const { rating, nps, comment, answers } = req.body;
    const userId = req.userId;
    const event_id = await resolveEventId(req.body.event_id);

    if (!event_id) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    const existing = await SurveyResponse.findOne({ where: { user_id: userId, event_id } });
    if (existing) {
      return res.status(400).json({ message: 'Survey already submitted' });
    }

    const survey = await SurveyResponse.create({
      user_id: userId,
      event_id,
      rating: rating != null ? rating : null,
      nps: nps != null ? nps : null,
      comment: comment || null,
      answers: answers || null,
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

    const surveys = await SurveyResponse.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role', 'email'] }],
      order: [['created_at', 'DESC']],
    });

    const withRating = surveys.filter((s) => s.rating != null);
    const avgRating = withRating.length > 0
      ? withRating.reduce((sum, s) => sum + s.rating, 0) / withRating.length
      : 0;
    const avgNPS = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + (s.nps || 0), 0) / surveys.length
      : 0;

    res.json({ surveys, avgRating, avgNPS, total: surveys.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitSurvey, getSurveyResults, getQuestionnaire, updateQuestionnaire };
