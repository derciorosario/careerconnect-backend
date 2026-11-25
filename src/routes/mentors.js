'use strict';
const express = require('express');
const router = express.Router();
const { getMentorDirectory, getMenteeDirectory, addWish, getMyWishes, getWishCount, removeWish, getWishesForMentor } = require('../controllers/mentorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getMentorDirectory);
router.get('/mentees', authenticate, authorize('mentor'), getMenteeDirectory);
router.post('/wish', authenticate, authorize('mentee'), addWish);
router.post('/wish/remove', authenticate, authorize('mentee'), removeWish);
router.get('/wish/my', authenticate, authorize('mentee'), getMyWishes);
router.get('/wish/count', authenticate, getWishCount);
router.get('/wish/received', authenticate, authorize('mentor'), getWishesForMentor);

module.exports = router;
