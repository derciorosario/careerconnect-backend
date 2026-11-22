'use strict';
const express = require('express');
const router = express.Router();
const {
  register, login, requestOTP, verifyOTP, verifyEmail, resendEmailOTP, forgotPassword, resetPassword, refreshToken, me,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/verify-email', verifyEmail);
router.post('/resend-email-otp', resendEmailOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, me);

module.exports = router;
