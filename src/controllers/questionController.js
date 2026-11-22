'use strict';
const { Question, QuestionVote, Session, AuditLog } = require('../models');

const getQuestions = async (req, res) => {
  try {
    const { session_id } = req.query;
    const where = session_id ? { session_id, status: 'visible' } : { status: 'visible' };
    const userId = req.userId;

    const questions = await Question.findAll({
      where,
      include: [
        { model: Question.sequelize.models.User, as: 'user', attributes: ['id', 'name'] },
        { model: QuestionVote, as: 'votes', attributes: ['id', 'user_id'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const formatted = questions.map((q) => {
      const plain = q.toJSON();
      const voteList = Array.isArray(plain.votes) ? plain.votes : [];
      return {
        ...plain,
        votes: voteList.length,
        voted: voteList.some((v) => v.user_id === userId),
      };
    });

    res.json({ questions: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { session_id, body, anonymous } = req.body;
    const userId = req.userId;

    // Auto-resolve session if not a valid UUID
    let sessId = session_id;
    if (!sessId || sessId === 'current') {
      const currentSession = await Session.findOne({ order: [['created_at', 'DESC']] });
      if (!currentSession) {
        return res.status(404).json({ message: 'No session found' });
      }
      sessId = currentSession.id;
    }

    const question = await Question.create({
      session_id: sessId,
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
      await existing.destroy();
    } else {
      await QuestionVote.create({ question_id, user_id: userId });
    }

    const count = await QuestionVote.count({ where: { question_id } });
    res.json({ message: 'Vote updated', votes: count, voted: !existing });
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
