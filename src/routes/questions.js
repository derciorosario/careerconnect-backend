'use strict';
const express = require('express');
const router = express.Router();
const {
  getQuestions, createQuestion, voteQuestion, moderateQuestion, updateQuestion, deleteQuestion, deleteAllQuestions,
} = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getQuestions);
router.post('/', authenticate, createQuestion);
router.post('/vote', authenticate, voteQuestion);
router.post('/moderate', authenticate, authorize('organizer'), moderateQuestion);
router.put('/:id', authenticate, authorize('organizer'), updateQuestion);
router.delete('/:id', authenticate, authorize('organizer'), deleteQuestion);
router.delete('/all', authenticate, authorize('organizer'), deleteAllQuestions);

module.exports = router;
