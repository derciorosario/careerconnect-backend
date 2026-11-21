'use strict';
const express = require('express');
const router = express.Router();
const { getMentorDirectory, addWish, getMyWishes, getWishCount } = require('../controllers/mentorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getMentorDirectory);
router.post('/wish', authenticate, authorize('mentee'), addWish);
router.get('/wish/my', authenticate, authorize('mentee'), getMyWishes);
router.get('/wish/count', authenticate, getWishCount);

module.exports = router;
