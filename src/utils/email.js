'use strict';
const nodemailer = require('nodemailer');

const BRAND = 'Career Connect';
const PRIMARY_500 = '#f26b0f';
const PRIMARY_600 = '#d95808';
const PRIMARY_100 = '#ffe6cf';
const NAVY_900 = '#0e1530';
const SURFACE_SOFT = '#eef0f5';
const LINE = '#d6dae6';
const INK = '#0e1530';
const INK_MUTED = '#4b5575';

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

const render = (headerHtml, bodyHtml, footerHtml) => `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f9; -webkit-text-size-adjust: 100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f9; min-width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid ${LINE};">
          ${headerHtml}
          ${bodyHtml}
          ${footerHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const headerBand = (title) => `
  <tr>
    <td align="center" style="background: linear-gradient(135deg, ${PRIMARY_500}, ${PRIMARY_600}); padding: 36px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">${BRAND}</h1>
      <p style="margin: 8px 0 0; color: ${PRIMARY_100}; font-size: 15px; font-weight: 600;">${title}</p>
    </td>
  </tr>
`;

const bodySection = (inner) => `
  <tr>
    <td style="padding: 36px 30px 24px; color: ${INK}; font-size: 15px; line-height: 1.6;">
      ${inner}
    </td>
  </tr>
`;

const codeBox = (code) => `
  <tr>
    <td align="center" style="padding: 30px 30px 10px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="display: inline-block; background-color: ${SURFACE_SOFT}; border: 2px dashed ${PRIMARY_500}; border-radius: 12px; padding: 24px 48px;">
            <span style="color: ${NAVY_900}; font-size: 36px; font-weight: 800; letter-spacing: 10px; font-variant-numeric: tabular-nums;">${code}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const footerBand = () => `
  <tr>
    <td style="background-color: ${SURFACE_SOFT}; padding: 24px 30px; text-align: center; border-top: 1px solid ${LINE};">
      <p style="margin: 0; color: ${INK_MUTED}; font-size: 13px; line-height: 1.5;">
        ${new Date().getFullYear()} ${BRAND}. Todos os direitos reservados.
      </p>
      <p style="margin: 8px 0 0; color: ${INK_MUTED}; font-size: 12px;">
        Esta mensagem foi enviada automaticamente. Por favor, não responda.
      </p>
    </td>
  </tr>
`;

const verificationEmailHtml = ({ name, code }) => render(
  headerBand('Verificação de Conta'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    <p style="margin: 0 0 24px;">Obrigado por criar a sua conta no ${BRAND}. Use o código abaixo para verificar o seu email:</p>
    ${codeBox(code)}
    <p style="margin: 0 0 12px; font-size: 14px;">Este código expira em <strong>10 minutos</strong>. Se não solicitou esta verificação, ignore este email.</p>
  `),
  footerBand()
);

const otpEmailHtml = ({ name, code }) => render(
  headerBand('Código de Confirmação'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    <p style="margin: 0 0 24px;">Aqui está o seu código de confirmação para entrar na ${BRAND}:</p>
    ${codeBox(code)}
    <p style="margin: 0 0 12px; font-size: 14px;">Este código expira em <strong>10 minutos</strong>. Se não solicitou este código, ignore este email.</p>
  `),
  footerBand()
);

const resendVerificationEmailHtml = ({ name, code }) => render(
  headerBand('Reenvio - Verificação de Conta'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    <p style="margin: 0 0 24px;">Reenviámos o seu código de verificação para a ${BRAND}. Use o código abaixo para verificar o seu email:</p>
    ${codeBox(code)}
    <p style="margin: 0 0 12px; font-size: 14px;">Este código expira em <strong>10 minutos</strong>. Se não solicitou este reenvio, ignore este email.</p>
  `),
  footerBand()
);

const forgotPasswordEmailHtml = ({ name, code }) => render(
  headerBand('Redefinição de Palavra-passe'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    <p style="margin: 0 0 24px;">Recebemos um pedido para redefinir a palavra-passe da sua conta na ${BRAND}. Use o código abaixo:</p>
    ${codeBox(code)}
    <p style="margin: 0 0 12px; font-size: 14px;">Este código expira em <strong>10 minutos</strong>. Se não solicitou esta redefinição, ignore este email e mantenha a sua palavra-passe atual.</p>
  `),
  footerBand()
);

const digitalTicketEmailHtml = ({ name, ticketCode, qrPayload }) => render(
  headerBand('O seu Bilhete Digital'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    <p style="margin: 0 0 24px;">O seu registo na ${BRAND} foi concluído com sucesso. Apresente este bilhete no evento.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
      <tr>
        <td style="padding: 4px 0; font-size: 14px; color: ${INK_MUTED};"><strong>Código do bilhete:</strong></td>
      </tr>
      <tr>
        <td style="padding: 4px 0 16px; font-size: 18px; font-weight: 700; color: ${NAVY_900}; letter-spacing: 2px;">${ticketCode}</td>
      </tr>
      ${qrPayload ? `
        <tr>
          <td align="center" style="padding: 16px 0;">
            <img src="${qrPayload}" alt="QR Code" style="display: block; max-width: 200px; width: 100%; height: auto; border-radius: 8px;" />
          </td>
        </tr>
      ` : ''}
    </table>
    <p style="margin: 0; font-size: 14px;">Bem-vindo à ${BRAND}.</p>
  `),
  footerBand()
);

module.exports = {
  sendEmail,
  verificationEmailHtml,
  otpEmailHtml,
  resendVerificationEmailHtml,
  forgotPasswordEmailHtml,
  digitalTicketEmailHtml,
};
