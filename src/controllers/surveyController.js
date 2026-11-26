'use strict';
const { SurveyResponse, Questionnaire, AuditLog, Event, User, Registration } = require('../models');
const { Op } = require('sequelize');
const { DEFAULT_QUESTIONNAIRE } = require('../utils/questionnaireDefaults');
const { notifyWhatsApp } = require('../utils/whatsapp');
const { sendEmail } = require('../utils/email');
const { notifyLanding } = require('../utils/landingNotify');

const resolveEventId = async (explicit) => {
  if (explicit && explicit !== 'current') return explicit;
  const active = await Event.findOne({
    where: { status: { [Op.notIn]: ['finished', 'closed'] } },
    order: [['starts_at', 'DESC']],
  });
  return active ? active.id : null;
};

const findQuestionnaire = async (event_id) => {
  let questionnaire = null;
  if (event_id) {
    questionnaire = await Questionnaire.findOne({ where: { event_id } });
  }
  if (!questionnaire) {
    questionnaire = await Questionnaire.findOne({ order: [['created_at', 'DESC']] });
  }
  return questionnaire;
};

const getQuestionnaire = async (req, res) => {
  try {
    const event_id = await resolveEventId(req.query.event_id);
    const questionnaire = await findQuestionnaire(event_id);
    res.json({
      content: questionnaire ? questionnaire.content : DEFAULT_QUESTIONNAIRE,
      main_enabled: questionnaire ? questionnaire.main_enabled !== false : true,
      impact_enabled: questionnaire ? questionnaire.impact_enabled !== false : true,
      certificate_enabled: questionnaire ? !!questionnaire.certificate_enabled : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateQuestionnaire = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { content, main_enabled, impact_enabled, certificate_enabled } = req.body;
    if (content !== undefined && (content === null || typeof content !== 'object')) {
      return res.status(400).json({ message: 'Conteúdo inválido.' });
    }
    const event_id = await resolveEventId(req.body.event_id);

    const questionnaire = await findQuestionnaire(event_id);

    if (questionnaire) {
      if (content !== undefined) questionnaire.content = content;
      if (main_enabled !== undefined) questionnaire.main_enabled = main_enabled;
      if (impact_enabled !== undefined) questionnaire.impact_enabled = impact_enabled;
      if (certificate_enabled !== undefined) questionnaire.certificate_enabled = certificate_enabled;
      if (event_id && !questionnaire.event_id) questionnaire.event_id = event_id;
      await questionnaire.save();
    } else {
      await Questionnaire.create({
        event_id,
        content: content !== undefined ? content : DEFAULT_QUESTIONNAIRE,
        main_enabled: main_enabled !== undefined ? main_enabled : true,
        impact_enabled: impact_enabled !== undefined ? impact_enabled : true,
        certificate_enabled: certificate_enabled !== undefined ? certificate_enabled : false,
      });
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_questionnaire',
      entity: 'Questionnaire',
      entity_id: questionnaire ? questionnaire.id : event_id,
    });

    res.json({
      content: questionnaire ? questionnaire.content : (content || DEFAULT_QUESTIONNAIRE),
      main_enabled: questionnaire ? questionnaire.main_enabled !== false : true,
      impact_enabled: questionnaire ? questionnaire.impact_enabled !== false : true,
      certificate_enabled: questionnaire ? !!questionnaire.certificate_enabled : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Returns whether the current user already submitted each form.
const getSurveyStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const event_id = await resolveEventId(req.query.event_id);
    const where = { user_id: userId };
    if (event_id) where.event_id = event_id;
    const response = await SurveyResponse.findOne({ where });
    res.json({
      main_sent: !!(response && response.main_sent),
      impact_sent: !!(response && response.impact_sent),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitSurvey = async (req, res) => {
  try {
    const { rating, nps, comment, answers, impact_answers, form } = req.body;
    const userId = req.userId;
    const event_id = await resolveEventId(req.body.event_id);

    if (!event_id) {
      return res.status(400).json({ message: 'No active event found.' });
    }

    const isImpact = form === 'impact';

    let response = await SurveyResponse.findOne({ where: { user_id: userId, event_id } });

    if (response) {
      if (isImpact) {
        if (response.impact_sent) {
          return res.status(400).json({ message: 'Avaliação de impacto já submetida.' });
        }
        response.impact_sent = true;
        response.impact_answers = impact_answers || answers || null;
      } else {
        if (response.main_sent) {
          return res.status(400).json({ message: 'Inquérito já submetido.' });
        }
        response.main_sent = true;
        response.answers = answers || null;
        if (rating != null) response.rating = rating;
        if (nps != null) response.nps = nps;
        if (comment != null) response.comment = comment;
      }
      await response.save();
    } else {
      response = await SurveyResponse.create({
        user_id: userId,
        event_id,
        rating: !isImpact && rating != null ? rating : null,
        nps: !isImpact && nps != null ? nps : null,
        comment: !isImpact ? (comment || null) : null,
        answers: !isImpact ? (answers || null) : null,
        impact_answers: isImpact ? (impact_answers || answers || null) : null,
        main_sent: !isImpact,
        impact_sent: isImpact,
      });
    }

    await AuditLog.create({
      actor_id: userId,
      action: 'submit_survey',
      entity: 'SurveyResponse',
      entity_id: response.id,
    });

    // Notify the landing contact (email + WhatsApp) about the new response.
    try {
      const user = await User.findByPk(userId, { attributes: ['name', 'email'] });
      const formLabel = isImpact ? 'Avaliação de Impacto da Mentoria' : 'Avaliação do Evento';
      await notifyLanding({
        subject: `[Career Connect] Nova resposta — ${formLabel}`,
        text: `Uma nova resposta ao questionário foi submetida.\n\nFormulário: ${formLabel}\nUtilizador: ${user?.name || 'Utilizador'}\nEmail: ${user?.email || '—'}\nData: ${new Date().toLocaleString('pt-PT')}`,
      });
    } catch (e) {
      // Non-blocking
    }

    res.status(201).json({ survey: response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Broadcast a notification to users that a questionnaire is available.
const notifySurvey = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { form } = req.body; // 'main' | 'impact' | 'certificate'
    const isImpact = form === 'impact';
    const isCert = form === 'certificate';
    const title = isCert
      ? 'Certificado Digital de Participação'
      : isImpact ? 'Avaliação de Impacto da Mentoria' : 'Formulário de Avaliação do Evento';
    const message = isCert
      ? `Olá! O seu Certificado Digital de Participação do Career Connect 2026 já está disponível. Acede à plataforma para o descarregar.`
      : `Olá! Já está disponível o ${title} do Career Connect 2026. Acede à plataforma para responder. A tua opinião é muito importante!`;

    const users = await User.findAll({
      where: { role: { [Op.in]: ['mentee', 'mentor'] }, is_active: true },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'notify_email', 'notify_whatsapp'],
      include: [{
        model: Registration,
        as: 'registrations',
        where: { status: 'present' },
        attributes: [],
      }],
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    let sent = 0;
    for (const user of users) {
      // For question forms (not the certificate) include the role-specific link.
      const link = isCert
        ? ''
        : (user.role === 'mentor'
          ? `${frontendUrl}/app/mentor/fecho`
          : `${frontendUrl}/app/mentee/fecho`);
      const userMessage = link ? `${message}\n\n${link}` : message;

      if (user.notify_whatsapp !== false && user.phone) {
        await notifyWhatsApp(user.phone, `${user.name ? `Olá ${user.name},` : 'Olá!'} ${userMessage}`);
        sent++;
      }
      if (user.notify_email !== false && user.email) {
        try {
          await sendEmail({ to: user.email, subject: `${title} - Career Connect`, text: userMessage });
          sent++;
        } catch (e) {
          // ignore individual failures
        }
      }
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'notify_survey',
      entity: 'Questionnaire',
      entity_id: form || 'main',
      metadata: { recipients: sent },
    });

    res.json({ message: 'Notificação enviada.', recipients: sent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSurveyResults = async (req, res) => {
  try {
    const { event_id } = req.query;
    const where = event_id && event_id !== 'current' ? { event_id } : {};

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

// Delete a single survey response (organizer only).
const deleteSurveyResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await SurveyResponse.findByPk(id);
    if (!response) {
      return res.status(404).json({ message: 'Resposta não encontrada.' });
    }
    await response.destroy();
    res.json({ message: 'Resposta eliminada.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete all survey responses (organizer only).
const deleteAllSurveyResponses = async (req, res) => {
  try {
    const organizerId = req.userId;
    const { event_id } = req.query;
    const where = event_id && event_id !== 'current' ? { event_id } : {};
    const deleted = await SurveyResponse.destroy({ where });

    await AuditLog.create({
      actor_id: organizerId,
      action: 'delete_all_survey_responses',
      entity: 'SurveyResponse',
      entity_id: event_id || 'all',
      metadata: { deleted },
    });

    res.json({ message: 'Todas as respostas foram eliminadas.', deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitSurvey, getSurveyResults, getQuestionnaire, updateQuestionnaire,
  getSurveyStatus, notifySurvey, deleteSurveyResponse, deleteAllSurveyResponses,
};