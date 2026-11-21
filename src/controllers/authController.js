'use strict';
const bcrypt = require('bcryptjs');
const { User, MenteeProfile, MentorProfile, Registration, Event, AuditLog } = require('../models');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
const { generateQR } = require('../utils/qr');

const { Op } = require('sequelize');

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Já existe uma conta com este e-mail' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      role,
      password_hash,
      password_salt: salt,
      consent_at: new Date(),
      consent_version: '1.0',
    });

    // Create role-specific profile
    if (role === 'mentee') {
      await MenteeProfile.create({ user_id: user.id });
    } else if (role === 'mentor') {
      await MentorProfile.create({
        user_id: user.id,
        approval: 'pending',
        max_mentees: 3,
      });
    }

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
        status: role === 'mentor' ? 'registered' : 'registered',
      });

      await AuditLog.create({
        actor_id: user.id,
        action: 'register',
        entity: 'Registration',
        entity_id: user.id,
      });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

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
      html: `<h2>Verificação de Email</h2><p>O seu código de verificação é: <strong>${otp}</strong>. Válido por 10 minutos.</p>`,
    });

    res.status(201).json({
      message: 'Conta criada. Verifique o seu email com o código enviado.',
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

    const user = await User.findOne({ where: { email } });
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

    const user = await User.findOne({ where: { email } });
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
      to: email,
      subject: 'Seu código OTP - Career Connect',
      text: `O seu código de verificação é: ${otp}. Válido por 10 minutos.`,
      html: `<h2>Código OTP</h2><p>O seu código de verificação é: <strong>${otp}</strong>. Válido por 10 minutos.</p>`,
    });

    res.json({ message: 'Código OTP enviado por email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
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

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    res.json({
      message: 'Email verificado com sucesso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
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
      html: `<h2>Reenvio - Verificação de Email</h2><p>O seu novo código de verificação é: <strong>${otp}</strong>. Válido por 10 minutos.</p>`,
    });

    res.json({ message: 'Código de verificação reenviado por email' });
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

module.exports = { register, login, requestOTP, verifyOTP, verifyEmail, resendEmailOTP, refreshToken, me };
