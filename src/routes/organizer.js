'use strict';
const express = require('express');
const router = express.Router();
const {
  getDashboard, getRegistrations, approveMentor, getRoundStatus, getReports,
} = require('../controllers/organizerController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('organizer'), getDashboard);
router.get('/registrations', authenticate, authorize('organizer'), getRegistrations);
router.post('/approve-mentor', authenticate, authorize('organizer'), approveMentor);
router.get('/rounds', authenticate, authorize('organizer'), getRoundStatus);
router.get('/reports', authenticate, authorize('organizer'), getReports);

module.exports = router;
