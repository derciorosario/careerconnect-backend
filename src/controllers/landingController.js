'use strict';
const { LandingConfig, AuditLog, Session, User, MentorProfile } = require('../models');
const { DEFAULT_LANDING_CONFIG } = require('../utils/landingDefaults');

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
    if (!mentor || !mp || !mp.show_on_landing) return;
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