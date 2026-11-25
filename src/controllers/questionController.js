'use strict';
const { Question, QuestionVote, Session, AuditLog, User, Registration } = require('../models');

const getQuestions = async (req, res) => {
  try {
    const { session_id, status } = req.query;
    const where = {};
    if (session_id) where.session_id = session_id;
    // Organizers can request all questions (incl. hidden) via status=all
    if (status === 'all') {
      // no status filter
    } else if (status) {
      where.status = status;
    } else {
      where.status = 'visible';
    }
    const userId = req.userId;

    const questions = await Question.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: User, as: 'mentor', attributes: ['id', 'name'] },
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
    const { session_id, body, anonymous, mentor_id } = req.body;
    const userId = req.userId;

    const author = await User.findByPk(userId, { attributes: ['id', 'role'] });

    // Mentees can only submit questions before check-in (before the event).
    // Once checked in (registration status 'present'), sending is blocked,
    // but they can still view the questions.
    if (author && author.role === 'mentee') {
      const registration = await Registration.findOne({
        where: { user_id: userId, status: 'present' },
      });
      if (registration) {
        return res.status(403).json({ message: 'Já fez check-in. As perguntas só podem ser enviadas antes do evento.' });
      }
    }

    // Auto-resolve session if not a valid UUID
    let sessId = session_id;
    if (!sessId || sessId === 'current') {
      const currentSession = await Session.findOne({ order: [['created_at', 'DESC']] });
      if (!currentSession) {
        return res.status(404).json({ message: 'No session found' });
      }
      sessId = currentSession.id;
    }

    // Mentor selection is optional; validate it when provided
    let mentorId = mentor_id || null;
    if (mentorId) {
      const mentor = await User.findOne({ where: { id: mentorId, role: 'mentor' } });
      if (!mentor) {
        return res.status(400).json({ message: 'Mentor inválido.' });
      }
    }

    const question = await Question.create({
      session_id: sessId,
      user_id: userId,
      mentor_id: mentorId,
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

    // Reload with associations so the client can render the mentor immediately
    const created = await Question.findByPk(question.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: User, as: 'mentor', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json({ question: created });
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

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { body, status, projected, anonymous, mentor_id } = req.body;
    const organizerId = req.userId;

    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (body !== undefined) question.body = body;
    if (status !== undefined) question.status = status;
    if (projected !== undefined) question.projected = projected;
    if (anonymous !== undefined) question.anonymous = anonymous;
    if (mentor_id !== undefined) {
      if (mentor_id) {
        const mentor = await User.findOne({ where: { id: mentor_id, role: 'mentor' } });
        if (!mentor) {
          return res.status(400).json({ message: 'Mentor inválido.' });
        }
      }
      question.mentor_id = mentor_id || null;
    }
    await question.save();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_question',
      entity: 'Question',
      entity_id: question.id,
    });

    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.userId;

    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.destroy();

    await AuditLog.create({
      actor_id: organizerId,
      action: 'delete_question',
      entity: 'Question',
      entity_id: id,
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAllQuestions = async (req, res) => {
  try {
    const organizerId = req.userId;

    const questions = await Question.findAll();
    const count = questions.length;

    if (count === 0) {
      return res.json({ message: 'No questions to delete' });
    }

    await Question.destroy({ where: {} });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'delete_all_questions',
      entity: 'Question',
      entity_id: 'all',
      metadata: { deletedCount: count },
    });

    res.json({ message: `${count} questions deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getQuestions, createQuestion, voteQuestion, moderateQuestion, updateQuestion, deleteQuestion, deleteAllQuestions };
