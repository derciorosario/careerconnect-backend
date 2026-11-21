'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { sequelize } = require('../config/db');

const db = {};

// Import all models
const modelFiles = fs.readdirSync(__dirname).filter(
  (file) => file !== 'index.js' && file.endsWith('.js')
);

modelFiles.forEach((file) => {
  const model = require(path.join(__dirname, file));
  db[model.name] = model;
});

// Define associations
const { Event, Session, Speaker, User, MenteeProfile, MentorProfile, Registration, Wish, Booking, Round, Match, Feedback, Connection, MentorshipRequest, Message, Question, QuestionVote, Poll, PollVote, Announcement, Notification, SurveyResponse, NextStep, Badge, AuditLog } = db;

// User has one MenteeProfile
User.hasOne(MenteeProfile, { foreignKey: 'user_id', as: 'menteeProfile' });
MenteeProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User has one MentorProfile
User.hasOne(MentorProfile, { foreignKey: 'user_id', as: 'mentorProfile' });
MentorProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Event has many Sessions
Event.hasMany(Session, { foreignKey: 'event_id', as: 'sessions' });
Session.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Speaker belongs to optional User
Speaker.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Speaker, { foreignKey: 'user_id', as: 'speakerProfile' });

// Session belongs to optional Speaker
Session.belongsTo(Speaker, { foreignKey: 'speaker_id', as: 'speaker' });

// Event has many Registrations
Event.hasMany(Registration, { foreignKey: 'event_id', as: 'registrations' });
Registration.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// User has many Registrations
User.hasMany(Registration, { foreignKey: 'user_id', as: 'registrations' });
Registration.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User has many Wishes (as mentee)
User.hasMany(Wish, { foreignKey: 'mentee_id', as: 'wishes' });
Wish.belongsTo(User, { foreignKey: 'mentee_id', as: 'mentee' });

// User has many Wishes (as mentor)
User.hasMany(Wish, { foreignKey: 'mentor_id', as: 'wishedBy' });
Wish.belongsTo(User, { foreignKey: 'mentor_id', as: 'mentor' });

// Event has many Wishes
Event.hasMany(Wish, { foreignKey: 'event_id', as: 'wishes' });
Wish.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// User has many Bookings
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Session has many Bookings
Session.hasMany(Booking, { foreignKey: 'session_id', as: 'bookings' });
Booking.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Event has many Rounds
Event.hasMany(Round, { foreignKey: 'event_id', as: 'rounds' });
Round.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Round has many Matches
Round.hasMany(Match, { foreignKey: 'round_id', as: 'matches' });
Match.belongsTo(Round, { foreignKey: 'round_id', as: 'round' });

// User has many Matches as mentor
User.hasMany(Match, { foreignKey: 'mentor_id', as: 'matchesAsMentor' });
Match.belongsTo(User, { foreignKey: 'mentor_id', as: 'mentor' });

// Match has many Feedback
Match.hasMany(Feedback, { foreignKey: 'match_id', as: 'feedback' });
Feedback.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

// User has many Feedback (as from_user)
User.hasMany(Feedback, { foreignKey: 'from_user_id', as: 'feedbackGiven' });
Feedback.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });

// User has many Feedback (as to_user)
User.hasMany(Feedback, { foreignKey: 'to_user_id', as: 'feedbackReceived' });
Feedback.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

// Connection associations
User.hasMany(Connection, { foreignKey: 'user_a', as: 'connectionsA' });
Connection.belongsTo(User, { foreignKey: 'user_a', as: 'userA' });

User.hasMany(Connection, { foreignKey: 'user_b', as: 'connectionsB' });
Connection.belongsTo(User, { foreignKey: 'user_b', as: 'userB' });

// MentorshipRequest associations
User.hasMany(MentorshipRequest, { foreignKey: 'mentee_id', as: 'mentorshipRequestsSent' });
MentorshipRequest.belongsTo(User, { foreignKey: 'mentee_id', as: 'mentee' });

User.hasMany(MentorshipRequest, { foreignKey: 'mentor_id', as: 'mentorshipRequestsReceived' });
MentorshipRequest.belongsTo(User, { foreignKey: 'mentor_id', as: 'mentor' });

// Message belongs to Connection
Connection.hasMany(Message, { foreignKey: 'connection_id', as: 'messages' });
Message.belongsTo(Connection, { foreignKey: 'connection_id', as: 'connection' });

// User has many Messages
User.hasMany(Message, { foreignKey: 'from_user_id', as: 'messagesSent' });
Message.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });

// Session has many Questions
Session.hasMany(Question, { foreignKey: 'session_id', as: 'questions' });
Question.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// User has many Questions
User.hasMany(Question, { foreignKey: 'user_id', as: 'questions' });
Question.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Question has many QuestionVotes
Question.hasMany(QuestionVote, { foreignKey: 'question_id', as: 'votes' });
QuestionVote.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// User has many QuestionVotes
User.hasMany(QuestionVote, { foreignKey: 'user_id', as: 'questionVotes' });
QuestionVote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Session has many Polls
Session.hasMany(Poll, { foreignKey: 'session_id', as: 'polls' });
Poll.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Poll has many PollVotes
Poll.hasMany(PollVote, { foreignKey: 'poll_id', as: 'votes' });
PollVote.belongsTo(Poll, { foreignKey: 'poll_id', as: 'poll' });

// User has many PollVotes
User.hasMany(PollVote, { foreignKey: 'user_id', as: 'pollVotes' });
PollVote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Event has many Announcements
Event.hasMany(Announcement, { foreignKey: 'event_id', as: 'announcements' });
Announcement.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// User has many Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User has many SurveyResponses
User.hasMany(SurveyResponse, { foreignKey: 'user_id', as: 'surveyResponses' });
SurveyResponse.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Event has many SurveyResponses
Event.hasMany(SurveyResponse, { foreignKey: 'event_id', as: 'surveyResponses' });
SurveyResponse.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// User has many NextSteps
User.hasMany(NextStep, { foreignKey: 'user_id', as: 'nextSteps' });
NextStep.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User has many Badges
User.hasMany(Badge, { foreignKey: 'user_id', as: 'badges' });
Badge.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User has many AuditLogs
User.hasMany(AuditLog, { foreignKey: 'actor_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
