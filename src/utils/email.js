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
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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

const footerBand = ({ showPlatformLink = true } = {}) => `
  <tr>
    <td style="background-color: ${SURFACE_SOFT}; padding: 24px 30px; text-align: center; border-top: 1px solid ${LINE};">
      <p style="margin: 0; color: ${INK_MUTED}; font-size: 13px; line-height: 1.5;">
        ${new Date().getFullYear()} ${BRAND}. Todos os direitos reservados.
      </p>
      ${showPlatformLink ? `
      <p style="margin: 12px 0 0; font-size: 13px;">
        <a href="${FRONTEND_URL}" style="color: ${PRIMARY_600}; font-weight: 700; text-decoration: none;">Aceder à plataforma</a>
      </p>` : ''}
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

const mentorApprovedEmailHtml = ({ name, approved }) => render(
  headerBand(approved ? 'Mentor Aprovado' : 'Mentor Rejeitado'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    ${approved ? `
      <p style="margin: 0 0 24px;">A sua candidatura como mentor na ${BRAND} foi <strong>aprovada</strong>! Já pode entrar na sua área de mentor e começar a receber mentorados.</p>
    ` : `
      <p style="margin: 0 0 24px;">Lamentamos informar que a sua candidatura como mentor na ${BRAND} foi <strong>rejeitada</strong>. Se achar que foi um erro, entre em contacto com a equipa organizadora.</p>
    `}
  `),
  footerBand()
);

const menteeApprovedEmailHtml = ({ name, approved }) => render(
  headerBand(approved ? 'Mentorado Aprovado' : 'Mentorado Rejeitado'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    ${approved ? `
      <p style="margin: 0 0 24px;">A sua candidatura como mentorado na ${BRAND} foi <strong>aprovada</strong>! Já pode entrar na sua área e começar a explorar mentores, pedir ligações e participar no evento.</p>
    ` : `
      <p style="margin: 0 0 24px;">Lamentamos informar que a sua candidatura como mentorado na ${BRAND} foi <strong>rejeitada</strong>. Se achar que foi um erro, entre em contacto com a equipa organizadora.</p>
    `}
  `),
  footerBand()
);

const messageReceivedEmailHtml = ({ receiverName, senderName, preview, checkinUrl }) => render(
  headerBand('Nova Mensagem'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${receiverName}!</h2>
    <p style="margin: 0 0 16px;">Recebeu uma nova mensagem de <strong>${senderName}</strong> na ${BRAND}.</p>
    <blockquote style="margin: 0 0 24px; padding: 16px 20px; background-color: ${SURFACE_SOFT}; border-left: 4px solid ${PRIMARY_500}; color: ${INK}; font-style: italic;">“${preview}”</blockquote>
    ${checkinUrl ? `
      <p style="margin: 0 0 24px;">Pode continuar a conversa na sua área pessoal.</p>
    ` : ''}
  `),
  footerBand()
);

const mentorshipRequestReceivedEmailHtml = ({ mentorName, menteeName, message, checkinUrl }) => render(
  headerBand('Novo Pedido de Mentoria'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${mentorName}!</h2>
    <p style="margin: 0 0 16px;">${menteeName} enviou-lhe um pedido de mentoria na ${BRAND}.</p>
    ${message ? `<blockquote style="margin: 0 0 24px; padding: 16px 20px; background-color: ${SURFACE_SOFT}; border-left: 4px solid ${PRIMARY_500}; color: ${INK}; font-style: italic;">“${message}”</blockquote>` : ''}
    <p style="margin: 0 0 24px;">Aceda à sua área de mentor para aceitar ou recusar o pedido.</p>
  `),
  footerBand()
);

const mentorshipRequestRespondedEmailHtml = ({ menteeName, mentorName, status, checkinUrl }) => render(
  headerBand(status === 'accepted' ? 'Pedido de Mentoria Aceite' : 'Pedido de Mentoria Recusado'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${menteeName}!</h2>
    ${status === 'accepted' ? `
      <p style="margin: 0 0 24px;">O mentor <strong>${mentorName}</strong> <strong>aceitou</strong> o seu pedido de mentoria na ${BRAND}. Já estão conectados e podem trocar mensagens.</p>
    ` : `
      <p style="margin: 0 0 24px;">O mentor <strong>${mentorName}</strong> <strong>recusou</strong> o seu pedido de mentoria na ${BRAND}. Pode continuar a explorar outros mentores.</p>
    `}
  `),
  footerBand()
);

const connectionCreatedEmailHtml = ({ userName, contactName, contactRole, checkinUrl }) => render(
  headerBand('Nova Ligação'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${userName}!</h2>
    <p style="margin: 0 0 24px;">Está agora conectado com <strong>${contactName}</strong> (${contactRole}) na ${BRAND}. Pode começar a trocar mensagens na sua área de conexões.</p>
  `),
  footerBand()
);

const digitalTicketEmailHtml = ({ name, ticketCode, qrPayload, checkinUrl }) => render(
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
      ${false ? `
        <tr>
          <td align="center" style="padding: 16px 0;">
            <img src="${qrPayload}" alt="QR Code" style="display: block; max-width: 200px; width: 100%; height: auto; border-radius: 8px;" />
          </td>
        </tr>
      ` : ''}
    </table>
    ${checkinUrl ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: 30px;">
        <tr>
          <td align="center" style="padding: 24px 30px; background-color: ${SURFACE_SOFT}; border-radius: 12px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: ${INK_MUTED}; font-weight: 600;">Check-in no evento</p>
            <a href="${checkinUrl}" style="display: inline-block; background-color: ${PRIMARY_500}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Abrir página de check-in</a>
            <p style="margin: 12px 0 0; font-size: 13px; color: ${INK_MUTED};">O organizador poderá confirmar a sua presença ao ler este QR code.</p>
          </td>
        </tr>
      </table>
    ` : ''}
    <p style="margin: 0; font-size: 14px;">Bem-vindo à ${BRAND}.</p>
  `),
  footerBand({ showPlatformLink: false })
);

const welcomeEmailHtml = ({ name, role }) => render(
  headerBand('Bem-vindo(a) ao Career Connect'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá, ${name}!</h2>
    <p style="margin: 0 0 24px;">A sua conta ${role === 'mentor' ? 'de mentor' : 'de mentorado'} no ${BRAND} está pronta. Já pode entrar na plataforma, explorar as funcionalidades e ${role === 'mentor' ? 'começar a receber mentorados' : 'conectar-se com mentores e participar no evento'}.</p>
    <p style="margin: 0; font-size: 14px;">Bem-vindo(a) à ${BRAND}.</p>
  `),
  footerBand()
);

const surveyNotificationEmailHtml = ({ name, title, message, link }) => render(
  headerBand(title || 'Novo Questionário'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá${name ? `, ${name}` : ''}!</h2>
    <p style="margin: 0 0 24px; white-space: pre-line;">${message}</p>
    ${link ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: 10px;">
        <tr>
          <td align="center" style="padding: 12px 0;">
            <a href="${link}" style="display: inline-block; background-color: ${PRIMARY_500}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Abrir questionário</a>
          </td>
        </tr>
      </table>
    ` : ''}
  `),
  footerBand({ showPlatformLink: !link })
);

const genericNotificationEmailHtml = ({ name, subject, text }) => render(
  headerBand(subject || 'Notificação'),
  bodySection(`
    <h2 style="margin: 0 0 16px; color: ${NAVY_900}; font-size: 22px; font-weight: 700;">Olá${name ? `, ${name}` : ''}!</h2>
    <p style="margin: 0; white-space: pre-line;">${text}</p>
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
  mentorApprovedEmailHtml,
  menteeApprovedEmailHtml,
  messageReceivedEmailHtml,
  mentorshipRequestReceivedEmailHtml,
  mentorshipRequestRespondedEmailHtml,
  connectionCreatedEmailHtml,
  welcomeEmailHtml,
  surveyNotificationEmailHtml,
  genericNotificationEmailHtml,
};
