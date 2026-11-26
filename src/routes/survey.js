'use strict';
const express = require('express');
const router = express.Router();
const { submitSurvey, getSurveyResults, getQuestionnaire, updateQuestionnaire, getSurveyStatus, notifySurvey, deleteSurveyResponse, deleteAllSurveyResponses } = require('../controllers/surveyController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, submitSurvey);
router.get('/', authenticate, getSurveyResults);
router.get('/status', authenticate, getSurveyStatus);
router.get('/questionnaire', authenticate, getQuestionnaire);
router.put('/questionnaire', authenticate, authorize('organizer'), updateQuestionnaire);
router.post('/notify', authenticate, authorize('organizer'), notifySurvey);
router.delete('/all', authenticate, authorize('organizer'), deleteAllSurveyResponses);
router.delete('/:id', authenticate, authorize('organizer'), deleteSurveyResponse);

module.exports = router;
