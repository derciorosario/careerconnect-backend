'use strict';
const { LandingConfig, AuditLog, Session, User, MentorProfile, Event } = require('../models');
const { DEFAULT_LANDING_CONFIG } = require('../utils/landingDefaults');

// Keep showing an event on the landing page until 7 days after it ends.
const EVENT_LINGER_MS = 7 * 24 * 60 * 60 * 1000;

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad2 = (n) => String(n).padStart(2, '0');

// YYYYMMDDTHHMMSSZ (UTC) for Google Calendar links
const toCalendarStamp = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
};

// An event is still relevant while now <= ends_at + 7 days.
const isEventRelevant = (event) => {
  const end = new Date(event.ends_at).getTime();
  if (Number.isNaN(end)) return false;
  return Date.now() <= end + EVENT_LINGER_MS;
};

// Build the landing `event` object from an Event row, keeping the exact same
// keys/shape as before so the page structure never breaks.
const buildEventFromRecord = (event) => {
  const start = new Date(event.starts_at);
  const venue = event.venue || '';
  const validStart = !Number.isNaN(start.getTime());

  return {
    dateLabel: validStart ? `${pad2(start.getDate())} de ${MONTHS_PT[start.getMonth()]} de ${start.getFullYear()}` : '',
    timeLabel: validStart ? `Início às ${pad2(start.getHours())}H${pad2(start.getMinutes())}` : '',
    locationLabel: venue,
    startAt: validStart ? start.toISOString() : null,
    venue,
    venueFull: venue,
    mapQuery: venue,
    calendarStart: toCalendarStamp(event.starts_at),
    calendarEnd: toCalendarStamp(event.ends_at),
  };
};

const getActiveEvent = async () => {
  try {
    return await Event.findOne({ where: { status: 'active' }, order: [['starts_at', 'ASC']] });
  } catch (e) {
    return null;
  }
};

const buildMasterclasses = async () => {

  const sessions = await Session.findAll({
    where: { type: 'masterclass' },
    include: [{
      model: User,
      as: 'mentor',
      where: { role: 'mentor' },
      include: [{ model: MentorProfile, as: 'mentorProfile' }],
    }],
    order: [['order', 'ASC'], ['created_at', 'ASC']],
  });

  const list = [];
  sessions.forEach((s) => {
    const mentor = s.mentor;
    const mp = mentor?.mentorProfile;
    if (!mentor || !mp ) return; //!mp.show_on_landing)
    const role = [mp.job_title, mp.company].filter(Boolean).join(' · ') || mp.job_title || '';
    list.push({
      id: list.length,
      initials: mp.initials || (mentor.name || '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
      name: mentor.name,
      role,
      theme: s.theme || '',
      title: s.title,
      biography: mp.biography || '',
      works: mp.works || '',
      photo_url: mentor.photo_url || '',
    });
  });
  return list;
};

const getLanding = async (req, res) => {
  try {
    const config = await LandingConfig.findOne({ order: [['created_at', 'DESC']] });
    const content = { ...(config ? config.content : DEFAULT_LANDING_CONFIG) };

    // Event info comes exclusively from the active event (status === 'active'),
    // and only while it is still relevant (up to 7 days after ends_at).
    // Otherwise `event` is null so the landing page shows a "next event" message.
    const activeEvent = await getActiveEvent();
    content.event = activeEvent && isEventRelevant(activeEvent) ? buildEventFromRecord(activeEvent) : null;

    // Masterclasses come exclusively from Sessions + Mentors (show_on_landing)
    try {
      content.masterclasses = await buildMasterclasses();
    } catch (e) {
      content.masterclasses = [];
    }

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLanding = async (req, res) => {
  try {
    const organizerId = req.userId;
    const content = req.body && req.body.content ? req.body.content : req.body;
    if (!content || typeof content !== 'object') {
      return res.status(400).json({ message: 'Conteúdo inválido.' });
    }

    let config = await LandingConfig.findOne({ order: [['created_at', 'DESC']] });
    if (config) {
      config.content = content;
      await config.save();
    } else {
      config = await LandingConfig.create({ content });
    }

    await AuditLog.create({
      actor_id: organizerId,
      action: 'update_landing',
      entity: 'LandingConfig',
      entity_id: config.id,
    });

    res.json(config.content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLanding, updateLanding };