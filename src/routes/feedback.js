'use strict';
const express = require('express');
const router = express.Router();
const { submitFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, submitFeedback);
router.get('/my', authenticate, getMyFeedback);

module.exports = router;
