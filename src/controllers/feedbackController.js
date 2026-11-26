'use strict';
const { Feedback, Match, AuditLog, User } = require('../models');
const { sendEmail, genericNotificationEmailHtml } = require('../utils/email');
const { notifyWhatsApp } = require('../utils/whatsapp');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const submitFeedback = async (req, res) => {
  try {
    const { match_id, to_user_id, wants_to_continue, usefulness, private_note } = req.body;
    const fromUserId = req.userId;

    const match = await Match.findByPk(match_id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const feedback = await Feedback.create({
      match_id,
      from_user_id: fromUserId,
      to_user_id,
      wants_to_continue,
      usefulness,
      private_note,
    });



    await AuditLog.create({
      actor_id: fromUserId,
      action: 'submit_feedback',
      entity: 'Feedback',
      entity_id: feedback.id,
    });

    // Check for mutual interest - create connection
    if (wants_to_continue) {

      const mutual = await Feedback.findOne({
        where: {
          match_id,
          from_user_id: to_user_id,
          to_user_id: fromUserId,
          wants_to_continue: true,
        },
      });

      console.log({mutual})

      if (mutual) {
        const { Connection } = require('../models');
        const [user_a, user_b] = [fromUserId, to_user_id].sort((a, b) => a - b);
        
        const existing = await Connection.findOne({ where: { user_a, user_b } });
       
        console.log({existing})


        if (!existing) {
          const connection = await Connection.create({ user_a, user_b, origin: 'mutual' });

          await AuditLog.create({
            actor_id: fromUserId,
            action: 'create_connection',
            entity: 'Connection',
            entity_id: connection.id,
          });
        }
      }
    }

    // Notify the evaluated user (email + WhatsApp) about the feedback.
    try {
      const [fromUser, toUser] = await Promise.all([
        User.findByPk(fromUserId, { attributes: ['id', 'name'] }),
        User.findByPk(to_user_id, { attributes: ['id', 'name', 'email', 'phone', 'notify_email', 'notify_whatsapp'] }),
      ]);

      if (toUser) {
        const message = wants_to_continue
          ? `Olá ${toUser.name}, ${fromUser ? fromUser.name : 'um participante'} gostaria de continuar a conexão consigo no Career Connect.`
          : `Olá ${toUser.name}, recebeu uma avaliação de ${fromUser ? fromUser.name : 'um participante'} no Career Connect.`;

        if (toUser.notify_email !== false && toUser.email) {
          try {
            sendEmail({
              to: toUser.email,
              subject: 'Nova avaliação - Career Connect',
              text: message,
              html: genericNotificationEmailHtml({ name: toUser.name, subject: 'Nova avaliação', text: message }),
            });
          } catch (e) {
            // ignore email failures
          }
        }

        if (toUser.notify_whatsapp !== false && toUser.phone) {
          try {
            await notifyWhatsApp(toUser.phone, `${message}\n\n${FRONTEND_URL}`);
          } catch (e) {
            // ignore whatsapp failures
          }
        }
      }
    } catch (e) {
      // Non-blocking
    }

    res.status(201).json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const feedback = await Feedback.findAll({
      where: { from_user_id: userId },
      include: [{ model: Match, as: 'match' }],
    });
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitFeedback, getMyFeedback };
