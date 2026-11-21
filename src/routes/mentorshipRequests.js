'use strict';
const express = require('express');
const router = express.Router();
const {
  createRequest, getMyRequests, getRequestsForMentor, respondToRequest,
} = require('../controllers/mentorshipRequestController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('mentee'), createRequest);
router.get('/my', authenticate, authorize('mentee'), getMyRequests);
router.get('/for-mentor', authenticate, authorize('mentor'), getRequestsForMentor);
router.post('/respond', authenticate, authorize('mentor'), respondToRequest);

module.exports = router;
