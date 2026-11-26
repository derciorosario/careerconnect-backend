'use strict';
const { LandingConfig } = require('../models');
const { sendEmail, genericNotificationEmailHtml } = require('./email');
const { notifyWhatsApp } = require('./whatsapp');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Returns the contact email/phone configured in the latest LandingConfig.
const getLandingContact = async () => {
  try {
    const config = await LandingConfig.findOne({ order: [['created_at', 'DESC']] });
    const content = config && config.content ? config.content : {};
    const email = typeof content.email === 'string' && content.email.trim() ? content.email.trim() : null;
    const phone = typeof content.phone === 'string' && content.phone.trim() ? content.phone.trim() : null;
    return { email, phone };
  } catch (e) {
    return { email: null, phone: null };
  }
};

// Send a notification to the landing contact via BOTH email and WhatsApp.
// Never throws — failures are swallowed so the primary action is unaffected.
const notifyLanding = async ({ subject, text }) => {
  const { email, phone } = await getLandingContact();

  if (email) {
    try {
       sendEmail({ to: email, subject, text, html: genericNotificationEmailHtml({ name: '', subject, text }) });
    } catch (e) {
      // ignore email failures
    }
  }

  if (phone) {
    try {
       notifyWhatsApp(phone, `${text}\n\n${FRONTEND_URL}`);
    } catch (e) {
      // ignore whatsapp failures
    }
  }

  return { email: !!email, phone: !!phone };
};

module.exports = { getLandingContact, notifyLanding };