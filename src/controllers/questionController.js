'use strict';
const { Question, QuestionVote, Session, AuditLog } = require('../models');

const getQuestions = async (req, res) => {
  try {
    const { session_id } = req.query;
    const where = session_id ? { session_id, status: 'visible' } : { status: 'visible' };
    
    const questions = await Question.findAll({
      where,
      include: [{ model: Question.sequelize.models.User, as: 'user', attributes: ['id', 'name', 'anonymous'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { session_id, body, anonymous } = req.body;
    const userId = req.userId;

    const question = await Question.create({
      session_id,
      user_id: userId,
      body,
      anonymous: anonymous || false,
      status: 'visible',
    });

    await AuditLog.create({
      actor_id: userId,
      action: 'create_question',
      entity: 'Question',
      entity_id: question.id,
    });

    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const voteQuestion = async (req, res) => {
  try {
    const { question_id } = req.body;
    const userId = req.userId;

    const existing = await QuestionVote.findOne({ where: { question_id, user_id: userId } });
    if (existing) {
      return res.status(400).json({ message: 'Already voted' });
    }

    await QuestionVote.create({ question_id, user_id: userId });

    res.json({ message: 'Vote recorded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const moderateQuestion = async (req, res) => {
  try {
    const { question_id, status, projected } = req.body;
    const organizerId = req.userId;

    const question = await Question.findByPk(question_id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (status) question.status = status;
    if (projected !== undefined) question.projected = projected;
    await question.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'moderate_question',
      entity: 'Question',
      entity_id: question.id,
    });

    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getQuestions, createQuestion, voteQuestion, moderateQuestion };
