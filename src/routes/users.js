'use strict';
const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, getAllUsers, getMenteeDashboard, getMentorDashboard,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/', authenticate, authorize('organizer'), getAllUsers);
router.get('/mentee/dashboard', authenticate, authorize('mentee'), getMenteeDashboard);
router.get('/mentor/dashboard', authenticate, authorize('mentor'), getMentorDashboard);

module.exports = router;
