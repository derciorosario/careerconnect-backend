'use strict';
const express = require('express');
const router = express.Router();
const {
  getQuestions, createQuestion, voteQuestion, moderateQuestion,
} = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getQuestions);
router.post('/', authenticate, createQuestion);
router.post('/vote', authenticate, voteQuestion);
router.post('/moderate', authenticate, authorize('organizer'), moderateQuestion);

module.exports = router;
