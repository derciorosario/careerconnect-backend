'use strict';
const nodemailer = require('nodemailer');

let transporter;
if (process.env.SMTP_TRANSPORT === 'log') {
  transporter = {
    sendMail: async (options) => {
      console.log('EMAIL:', options);
      return { messageId: 'log-mode' };
    },
  };
} else {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const sendEmail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
