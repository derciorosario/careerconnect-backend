'use strict';
const bcrypt = require('bcryptjs');
const { User, MenteeProfile, MentorProfile, Registration, Event, AuditLog } = require('../models');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { sendEmail, verificationEmailHtml, otpEmailHtml, resendVerificationEmailHtml, forgotPasswordEmailHtml, digitalTicketEmailHtml, mentorApprovedEmailHtml, welcomeEmailHtml } = require('../utils/email');
const { notifyWhatsApp, formatPhoneNumber } = require('../utils/whatsapp');
const { generateQR } = require('../utils/qr');
const { notifyLanding } = require('../utils/landingNotify');
const { normalizeLevel } = require('../utils/registrationDefaults');

const { Op } = require('sequelize');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// When true, mentees follow the same approval flow as mentors: their account
// stays pending until an organizer approves it, and they cannot log in before that.
const MENTEE_REQUIRES_APPROVAL = String(process.env.MENTEE_REQUIRES_APPROVAL || 'false').toLowerCase() === 'true';

// Normalise a value coming from multipart form-data into a plain array.
// The client sends JSON.stringify(...) strings, but JSON columns must receive
// real arrays (otherwise Sequelize double-encodes them into a JSON string).
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Fall back to a comma-separated list.
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

// Find a user by either an email address or a phone/WhatsApp number.
// The login form accepts both in the same field.
const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const value = String(identifier).trim();
  if (value.includes('@')) {
    return User.findOne({ where: { email: value } });
  }
  const formatted = formatPhoneNumber(value);
  const conditions = [{ phone: value }];
  if (formatted) conditions.push({ phone: formatted });
  return User.findOne({ where: { [Op.or]: conditions } });
};

const register = async (req, res) => {
  try {
    const {
      name, email, phone, password, role,
      level, course, institution, interests, goal, pitch, jobObstacle,
      jobTitle, company, sector, years, mentorInterests, canHelpGoals, supportType,
      photo, linkedin,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      if (existing.emailVerified) {
        return res.status(400).json({ message: 'Já existe uma conta verificada com este e-mail' });
      }
      // Delete unverified user so they can re-register
      await existing.destroy();
    }

    // Validate phone number is not already registered.
    // Normalise with the 258 country code so that "258...", "+258...",
    // "0..." and local 9-digit numbers are all treated as the same number.
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const phoneConditions = [{ phone: String(phone).trim() }];
      if (formattedPhone) phoneConditions.push({ phone: formattedPhone });
      const phoneOwner = await User.findOne({ where: { [Op.or]: phoneConditions } });
      if (phoneOwner) {
        return res.status(400).json({ message: 'Já existe uma conta com este número de telemóvel' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone: phone ? (formatPhoneNumber(phone) || phone) : phone,
      role,
      password_hash,
      password_salt: salt,
      photo_url: req.file ? `/uploads/${req.file.filename}` : (photo || null),
      linkedin_url: linkedin || null,
      consent_at: new Date(),
      consent_version: '1.0',
    });

    // Create role-specific profile with all fields
    if (role === 'mentee') {
      await MenteeProfile.create({
        user_id: user.id,
        level: normalizeLevel(level),
        course: course || '',
        institution: institution || '',
        interests: toArray(interests),
        goal: goal || '',
        pitch: pitch || '',
        job_obstacle: jobObstacle || null,
        approval: MENTEE_REQUIRES_APPROVAL ? 'pending' : 'approved',
      });
    } else if (role === 'mentor') {
      await MentorProfile.create({
        user_id: user.id,
        job_title: jobTitle || '',
        company: company || '',
        sector: sector || '',
        years: years ? Number(years) : 0,
        interests: toArray(mentorInterests),
        can_help_goals: toArray(canHelpGoals),
        support_type: supportType || '',
        max_mentees: 3,
        approval: 'pending',
      });
    }

    // Notify the landing contact (email + WhatsApp) about the new registration.
    notifyLanding({
      subject: `[Career Connect] Novo registo — ${role}`,
      text: `Um novo utilizador registou-se na plataforma.\n\nNome: ${name}\nEmail: ${email}\nTelefone: ${phone || '—'}\nPerfil: ${role}\nData: ${new Date().toLocaleString('pt-PT')}`,
    }).catch(() => {});

    // Create default event registration
    const event = await Event.findOne({ where: { status: 'active' } });
    if (event) {
      const ticket_code = 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const qrPayload = JSON.stringify({ userId: user.id, ticket_code });
      const qrDataUrl = await generateQR(qrPayload);

      await Registration.create({
        event_id: event.id,
        user_id: user.id,
        ticket_code,
        qr_payload: qrDataUrl,
        status: 'registered',
      });

      await AuditLog.create({
        actor_id: user.id,
        action: 'register',
        entity: 'Registration',
        entity_id: user.id,
      });
    }

    // Generate email verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp_code = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'Verifique o seu email - Career Connect',
      text: `O seu código de verificação é: ${otp}. Válido por 10 minutos.`,
      html: verificationEmailHtml({ name, code: otp }),
    });

    // Send OTP via WhatsApp (if the user provided a phone number)
    await notifyWhatsApp(phone, `Olá, ${name}! O seu código de verificação do Career Connect é: ${otp}. Válido por 10 minutos.\n\n${FRONTEND_URL}`);

    res.status(201).json({
      message: 'Conta criada. Verifique o seu email e WhatsApp com o código enviado.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      requiresEmailVerification: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByIdentifier(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (user.password_hash) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Email não verificado. Verifique o seu email antes de entrar.' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: 'A sua conta foi desactivada. Contacte a organização.' });
    }

    // For mentors: check if mentor profile is approved
    if (user.role === 'mentor') {
      const mentorProfile = await MentorProfile.findOne({ where: { user_id: user.id } });
      if (!mentorProfile || mentorProfile.approval !== 'approved') {
        return res.status(403).json({ message: 'A sua conta de mentor ainda está pendente de aprovação pela equipa. Aguarde a aprovação antes de entrar.' });
      }
    }

    // For mentees (when the approval flow is enabled): check if mentee profile is approved
    if (user.role === 'mentee' && MENTEE_REQUIRES_APPROVAL) {
      const menteeProfile = await MenteeProfile.findOne({ where: { user_id: user.id } });
      if (!menteeProfile || menteeProfile.approval !== 'approved') {
        return res.status(403).json({ message: 'A sua conta ainda está pendente de aprovação pela equipa. Aguarde a aprovação antes de entrar.' });
      }
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    res.json({
      message: 'Login bem-sucedido',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await findUserByIdentifier(email);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp_code = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    // Send OTP via email
    await sendEmail({
      to: user.email,
      subject: 'Seu código OTP - Career Connect',
      text: `O seu código de verificação é: ${otp}. Válido por 10 minutos.`,
      html: otpEmailHtml({ name: user.name, code: otp }),
    });

    // Send OTP via WhatsApp (if the user has a phone number)
    await notifyWhatsApp(user.phone, `Olá, ${user.name}! O seu código OTP do Career Connect é: ${otp}. Válido por 10 minutos.\n\n${FRONTEND_URL}`);

    res.json({ message: 'Código OTP enviado por email e WhatsApp' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await findUserByIdentifier(email);
    if (!user || user.otp_code !== otp) {
      return res.status(401).json({ message: 'Código OTP inválido' });
    }

    if (user.otp_expires_at < new Date()) {
      return res.status(401).json({ message: 'Código OTP expirado' });
    }

    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    res.json({
      message: 'Verificação bem-sucedida',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || user.otp_code !== otp) {
      return res.status(401).json({ message: 'Código de verificação inválido' });
    }

    if (user.otp_expires_at < new Date()) {
      return res.status(401).json({ message: 'Código de verificação expirado' });
    }

    user.otp_code = null;
    user.otp_expires_at = null;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Find registration to get ticket code and QR payload
    const registration = await Registration.findOne({ where: { user_id: user.id } });
    const ticketCode = registration?.ticket_code || null;
    const qrPayload = registration?.qr_payload || null;

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    // For mentees: send digital ticket with QR Code.
    // When MENTEE_REQUIRES_APPROVAL is enabled, the ticket is only sent after the
    // organizer approves the mentee (handled in organizerController.approveMentor).
    if (user.role === 'mentee' && ticketCode && !MENTEE_REQUIRES_APPROVAL) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const checkinUrl = `${frontendUrl}/checkin?ticket_code=${ticketCode}`;
      await sendEmail({
        to: email,
        subject: 'O seu bilhete digital - Career Connect',
        text: `O seu registo foi concluído. Bilhete: ${ticketCode}. Código curto: ${ticketCode}.`,
        html: digitalTicketEmailHtml({ name: user.name, ticketCode, qrPayload, checkinUrl }),
      });

      // Send digital ticket via WhatsApp (if the user has a phone number)
      await notifyWhatsApp(user.phone, `Olá, ${user.name}! O seu registo no Career Connect foi concluído. Bilhete: ${ticketCode}. Apresente este código no evento.\n\n${FRONTEND_URL}`);
    }

    // Welcome message for mentees once their email is confirmed (email + WhatsApp).
    // Skipped when the mentee still needs organizer approval (mirrors the mentor flow,
    // where the welcome message is only sent after approval).
    if (user.role === 'mentee' && !(MENTEE_REQUIRES_APPROVAL)) {
      const welcomeText = `Olá ${user.name}, bem-vindo(a) ao Career Connect! O seu email foi confirmado e a sua conta de mentorado está activa. Já pode explorar mentores, pedir ligações e participar no evento.`;
      try {
        await sendEmail({
          to: email,
          subject: 'Bem-vindo(a) ao Career Connect',
          text: welcomeText,
          html: welcomeEmailHtml({ name: user.name, role: 'mentee' }),
        });
      } catch (e) {
        // ignore email failures
      }
      await notifyWhatsApp(user.phone, `${welcomeText}\n\n${FRONTEND_URL}`);
    }

    const requiresApproval = user.role === 'mentor' || (user.role === 'mentee' && MENTEE_REQUIRES_APPROVAL);

    res.json({
      message: 'Email verificado com sucesso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
      ticketCode,
      requiresApproval,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email já verificado' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp_code = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Reenvio - Verifique o seu email - Career Connect',
      text: `O seu novo código de verificação é: ${otp}. Válido por 10 minutos.`,
      html: resendVerificationEmailHtml({ name: user.name, code: otp }),
    });

    // Send verification code via WhatsApp (if the user has a phone number)
    await notifyWhatsApp(user.phone, `Olá, ${user.name}! O seu novo código de verificação do Career Connect é: ${otp}. Válido por 10 minutos.\n\n${FRONTEND_URL}`);

    res.json({ message: 'Código de verificação reenviado por email e WhatsApp' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp_code = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Redefinição de palavra-passe - Career Connect',
      text: `O seu código de redefinição é: ${otp}. Válido por 10 minutos.`,
      html: forgotPasswordEmailHtml({ name: user.name, code: otp }),
    });

    // Send reset code via WhatsApp (if the user has a phone number)
    await notifyWhatsApp(user.phone, `Olá, ${user.name}! O seu código de redefinição de palavra-passe do Career Connect é: ${otp}. Válido por 10 minutos.\n\n${FRONTEND_URL}`);

    res.json({ message: 'Código de redefinição enviado por email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'A nova palavra-passe precisa de pelo menos 6 caracteres.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || user.otp_code !== otp) {
      return res.status(401).json({ message: 'Código de redefinição inválido' });
    }

    if (user.otp_expires_at < new Date()) {
      return res.status(401).json({ message: 'Código de redefinição expirado' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    user.password_salt = salt;
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    res.json({ message: 'Palavra-passe redefinida com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ message: 'Conta desactivada' });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { model: MenteeProfile, as: 'menteeProfile' },
        { model: MentorProfile, as: 'mentorProfile' },
      ],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTestUsers = async (req, res) => {
  try {
    const { User } = require('../models');
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role'],
      order: [['role', 'ASC'], ['name', 'ASC']],
    });
    const withPassword = users.map((u) => ({
      ...u.toJSON ? u.toJSON() : u,
      testPassword: u.role === 'organizer' ? 'Organizer123!' : u.role === 'mentor' ? 'Mentor123!' : 'Mentee123!',
    }));
    res.json({ users: withPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, requestOTP, verifyOTP, verifyEmail, resendEmailOTP, forgotPassword, resetPassword, refreshToken, me, getTestUsers };
