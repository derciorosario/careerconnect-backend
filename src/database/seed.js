'use strict';
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const db = require('../models');

const BASIC_SEED = false; // Set to false to seed everything

// ── Seed configuration ──────────────────────────────────────────────────────
// Number of mentees to create. Change this value to seed more/fewer mentees.
const MENTEE_COUNT = 20;
// Number of generated mentors (with varied info). Landing mentors are extra.
const MENTOR_COUNT = 0;

const {
  User, MentorProfile, MenteeProfile, Event, Session, Registration, Round,
  Speaker, Booking, Wish, Match, Feedback, Connection, MentorshipRequest,
  Message, Question, Poll, PollVote, Announcement, Notification, SurveyResponse,
  NextStep, Badge, AuditLog, Questionnaire, RegistrationConfig, LandingConfig,
} = db;
const { DEFAULT_QUESTIONNAIRE } = require('../utils/questionnaireDefaults');
const { DEFAULT_REGISTRATION_CONFIG } = require('../utils/registrationDefaults');
const { DEFAULT_LANDING_CONFIG } = require('../utils/landingDefaults');

// Options come straight from registrationDefaults.js so mentors/mentees stay
// consistent with the registration form.
const AREAS = DEFAULT_REGISTRATION_CONFIG.areas;
const GOALS = DEFAULT_REGISTRATION_CONFIG.goals;
const OBSTACLES = DEFAULT_REGISTRATION_CONFIG.obstacles;
const SUPPORT_TYPES = DEFAULT_REGISTRATION_CONFIG.support_types;
const LEVELS = DEFAULT_REGISTRATION_CONFIG.levels;
const ACADEMIC_EDUCATION = DEFAULT_REGISTRATION_CONFIG.academic_education;
const TECHNICAL_COURSES = DEFAULT_REGISTRATION_CONFIG.technical_courses;
const LEVEL_MAP = {
  'Estudante': 'estudante',
  'Recém-graduado': 'recem_graduado',
  'Profissional Júnior': 'profissional_junior',
};

// ── Name / profile pools (used to generate varied mentors & mentees) ────────
const FIRST_NAMES = [
  'Ana', 'Bruno', 'Cláudia', 'Dino', 'Elsa', 'Fátima', 'Gerson', 'Helena',
  'Ivo', 'Júlia', 'Kelton', 'Lídia', 'Mário', 'Nádia', 'Osvaldo', 'Paula',
  'Quitéria', 'Rui', 'Sofia', 'Tomás', 'Ursula', 'Vasco', 'Wilson', 'Xavier',
  'Yara', 'Zena', 'Alberto', 'Beatriz', 'Carlos', 'Diana', 'Eduardo', 'Fernanda',
  'Gabriel', 'Hilda', 'Irene', 'Joaquim', 'Karina', 'Luís', 'Marta', 'Nelson',
];
const LAST_NAMES = [
  'Mondlane', 'Chissano', 'Nhantumbo', 'Matola', 'Macie', 'Sitoe', 'Tembe',
  'Cumbe', 'Bila', 'Mussa', 'Machava', 'Zimba', 'Cossa', 'Chambule', 'Mabjaia',
  'Langa', 'Cuna', 'Sibambo', 'Manhiça', 'Chale', 'Macamo', 'Nhaca', 'Dabula',
  'Guimarães', 'Fernandes', 'Santos', 'Coutinho', 'Almeida', 'Nhampossa', 'Massingue',
];
const JOB_TITLES = [
  'Engenheiro de Software', 'Analista de Dados', 'Director de Marketing', 'Advogado',
  'Gestor de Recursos Humanos', 'Contabilista', 'Empreendedor', 'Consultor de Carreira',
  'Director Financeiro', 'Designer Gráfico', 'Engenheiro Civil', 'Médico',
  'Professor', 'Jornalista', 'Gestor de Projetos', 'Analista Financeiro',
  'Desenvolvedor Web', 'Administrador de Redes', 'Coordenador de Logística',
  'Especialista em Marketing Digital',
];
const COMPANIES = [
  'Vodacom', 'Standard Bank', 'Vale Moçambique', 'TechSolutions', 'Mussa & Associados',
  'Zimba Agro', 'Arafat Executive Academy', 'Salto Moçambique', 'SDO Moçambique',
  'ISCTEM', 'UEM', 'Galp Moçambique', 'Coca-Cola', 'Unilever', 'Deloitte', 'PwC',
  'Unitel', 'Movitel', 'Banco BCI', 'Millennium bim',
];
const COURSES = [
  'Engenharia Informática', 'Direito', 'Economia', 'Agronomia', 'Marketing',
  'Contabilidade', 'Recursos Humanos', 'Comunicação', 'Gestão', 'Medicina',
  'Arquitetura', 'Jornalismo',
];
const INSTITUTIONS = ['UEM', 'ISCTEM', 'ISUTC', 'ISCIM', 'UP', 'Pedagogógica', 'Zambeze', 'Lúrio'];
const PITCHES = [
  'Estudante do último ano à procura de orientação de carreira.',
  'Procuro orientação para o meu primeiro estágio.',
  'Quero comunicar melhor o que sei fazer.',
  'Quero reforçar as minhas competências técnicas.',
  'Tenho uma ideia de negócio e preciso de apoio.',
  'Quero mudar de área e preciso de direção.',
  'Recém-graduado à procura do primeiro emprego.',
  'Quero construir a minha marca pessoal.',
];

const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
const pick2 = (arr, i) => {
  const a = pick(arr, i);
  const b = pick(arr, i + 1);
  return a === b ? [a] : [a, b];
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await sequelize.sync({ force: true });
    console.log('Models synchronized...');

    console.log('Seeding data...');

    const salt = await bcrypt.genSalt(10);
    const hash = (pw) => bcrypt.hash(pw, salt);

    // ── ORGANIZER ───────────────────────────────────────────
    const organizer = await User.create({
      name: 'Organizador Career Connect',
      email: 'organizador@careerconnect.co.mz',
      phone: '+258840000000',
      role: 'organizer',
      password_hash: await hash('Organizer123!'),
      password_salt: salt,
      emailVerified: true,
    });

    // ── EVENT ───────────────────────────────────────────────
    const event = await Event.create({
      name: 'Career Connect 2026',
      starts_at: new Date('2026-12-04T14:00:00+02:00'),
      ends_at: new Date('2026-12-04T17:00:00+02:00'),
      venue: 'Hotel Cardoso, Maputo',
      capacity: 120,
      status: 'active',
      round_minutes: 10,
      rounds_per_break: 2,
      max_mentees_per_mentor: 5,
      warn_seconds: 30,
      tables_count: 10,
      match_weights: { areas: 45, goal: 20, sector: 10, want: 15, variety: 10 },
    });

    // ── LANDING MASTERCLASS MENTORS (show_on_landing) ───────
    // interests / can_help_goals come from registrationDefaults.js
    const landingMentors = [
      {
        name: 'Vicente Sitoe', email: 'vicente@careerconnect.co.mz', initials: 'VS',
        job_title: 'Director Geral da SDO Moçambique', company: 'SDO Moçambique', sector: 'Preparação para o Mercado de Trabalho',
        theme: 'Preparação para o Mercado de Trabalho',
        title: 'Da Formação para o Mercado de Trabalho: Estratégias para Encontrar o Primeiro Emprego',
        biography: 'Mestre em Psicologia e Pedagogia, com experiência em consultoria estratégica, gestão de recursos humanos e desenvolvimento organizacional. É autor de “RH com H de Humano” e de “Para uma Gestão de Pessoas Humanizada”.',
        works: 'Obras: Viagem, pelos trilhos da vida · Avaliação de Desempenho Automatizada, Guia Prático · Para uma Gestão de Pessoas Humanizada · Poemas para Boi Dormir · Ensaio sobre um Manifesto · RH com H de Humano',
      },
      {
        name: 'Arafat Cossa', email: 'arafat@careerconnect.co.mz', initials: 'AC',
        job_title: 'Director da Arafat Executive Academy', company: 'Arafat Executive Academy', sector: 'Posicionamento e Oportunidades',
        theme: 'Posicionamento e Oportunidades',
        title: 'A Arte do Networking: Como Transformar Conexões em Oportunidades de Carreira',
        biography: 'Formado em Comunicação e Relações Empresariais pelo ISCIM, é orador, formador, escritor e consultor. É autor de “Oratória: O Oxigénio das Relações de Influência”.',
        works: '',
      },
      {
        name: 'Marlene Chambule', email: 'marlene@careerconnect.co.mz', initials: 'MC',
        job_title: 'Directora Executiva da Salto Moçambique', company: 'Salto Moçambique', sector: 'Desenvolvimento e Crescimento na Carreira',
        theme: 'Desenvolvimento e Crescimento na Carreira',
        title: 'Fui Contratado. E Agora? Como Construir uma Carreira de Sucesso',
        biography: 'Licenciada em Ciências Políticas pela Universidade Eduardo Mondlane (UEM), construiu a sua carreira na Vale Moçambique e na Galp Moçambique. É fundadora da Salto Moçambique, dedicada à formação e à mentoria.',
        works: '',
      },
    ];

    const landingMentorUsers = [];
    const landingSessions = [];
    const breakSessions = [];
    for (let i = 0; i < landingMentors.length; i++) {
      const lm = landingMentors[i];
      const u = await User.create({
        name: lm.name,
        email: lm.email,
        phone: `+2588500000${i}`,
        role: 'mentor',
        password_hash: await hash('Mentor123!'),
        password_salt: salt,
        emailVerified: true,
      });
      await MentorProfile.create({
        user_id: u.id,
        job_title: lm.job_title,
        company: lm.company,
        sector: lm.sector,
        years: 8,
        interests: pick2(AREAS, i),
        can_help_goals: pick2(GOALS, i + 2),
        support_type: pick(SUPPORT_TYPES, i),
        max_mentees: 3,
        approval: 'approved',
        show_on_landing: true,
        initials: lm.initials,
        biography: lm.biography,
        works: lm.works,
      });
      landingMentorUsers.push(u);

      const masterclassOrder = i * 2 + 1;
      const s = await Session.create({
        event_id: event.id,
        order: masterclassOrder,
        type: 'masterclass',
        title: lm.title,
        theme: lm.theme,
        mentor_id: u.id,
        starts_at: new Date('2026-12-04T14:00:00+02:00'),
      });
      landingSessions.push(s);

      if (i < landingMentors.length - 1) {
        const b = await Session.create({
          event_id: event.id,
          order: masterclassOrder + 1,
          type: 'break',
          title: `Intervalo ${i + 1} - Rondas de networking`,
          starts_at: new Date('2026-12-04T15:00:00+02:00'),
        });
        breakSessions.push(b);
      }
    }

    // ── GENERATED MENTORS (varied pool) ─────────────────────
    const mentorUsers = [...landingMentorUsers];
    for (let i = 0; i < MENTOR_COUNT; i++) {
      const first = pick(FIRST_NAMES, i);
      const last = pick(LAST_NAMES, i * 13 + Math.floor(i / FIRST_NAMES.length));
      const u = await User.create({
        name: `${first} ${last}`,
        email: `mentor${i + 1}@careerconnect.co.mz`,
        phone: `+2588${String(60000000 + i)}`,
        role: 'mentor',
        password_hash: await hash('Mentor123!'),
        password_salt: salt,
        emailVerified: true,
      });
      await MentorProfile.create({
        user_id: u.id,
        job_title: pick(JOB_TITLES, i),
        company: pick(COMPANIES, i),
        sector: pick(AREAS, i),
        years: 3 + (i % 12),
        interests: pick2(AREAS, i),
        can_help_goals: pick2(GOALS, i),
        support_type: pick(SUPPORT_TYPES, i),
        max_mentees: 2 + (i % 3),
        approval: 'approved',
      });
      mentorUsers.push(u);
    }

    // ── MENTEES (count set by MENTEE_COUNT) ─────────────────
    const menteeUsers = [];
    for (let i = 0; i < MENTEE_COUNT; i++) {
      const first = pick(FIRST_NAMES, i + 5);
      const last = pick(LAST_NAMES, i * 7 + 3);
      const u = await User.create({
        name: `${first} ${last}`,
        email: `mentee${i + 1}@careerconnect.co.mz`,
        phone: `+2588${String(70000000 + i)}`,
        role: 'mentee',
        password_hash: await hash('Mentee123!'),
        password_salt: salt,
        emailVerified: true,
      });
      await MenteeProfile.create({
        user_id: u.id,
        level: LEVEL_MAP[pick(LEVELS, i)] || 'estudante',
        course: pick(COURSES, i),
        institution: pick(INSTITUTIONS, i),
        academic_education: pick(ACADEMIC_EDUCATION, i),
        technical_course: pick(TECHNICAL_COURSES, i),
        interests: pick2(AREAS, i + 1),
        goal: pick(GOALS, i),
        pitch: pick(PITCHES, i),
        job_obstacle: pick(OBSTACLES, i),
      });
      menteeUsers.push(u);
    }

    // ── QUESTIONNAIRE (event evaluation form) ────────────────
    await Questionnaire.create({
      event_id: event.id,
      content: DEFAULT_QUESTIONNAIRE,
    });

    // ── REGISTRATION CONFIG (editable form options) ──────────
    await RegistrationConfig.create(DEFAULT_REGISTRATION_CONFIG);

    // ── LANDING PAGE CONFIG ──────────────────────────────────
    await LandingConfig.create({ content: DEFAULT_LANDING_CONFIG });

    // ── ROUNDS (all "planned") ──────────────────────────────
    const rounds = [];
    for (let b = 1; b <= 2; b++) {
      for (let r = 1; r <= 2; r++) {
        const round = await Round.create({
          event_id: event.id,
          break_no: b,
          round_no: r,
          status: 'planned',
        });
        rounds.push(round);
      }
    }

    if (!BASIC_SEED) {
      // ── SPEAKERS (landing mentors) ──────────────────────────
      await Speaker.create({
        event_id: event.id,
        session_id: landingSessions[0].id,
        name: landingMentors[0].name,
        role: landingMentors[0].job_title,
        company: landingMentors[0].company,
        topic: 'Estratégias para encontrar o primeiro passo',
        bio: landingMentors[0].biography,
        user_id: landingMentorUsers[0].id,
      });
      await Speaker.create({
        event_id: event.id,
        session_id: landingSessions[1].id,
        name: landingMentors[1].name,
        role: landingMentors[1].job_title,
        company: landingMentors[1].company,
        topic: 'A arte de criar redes de contactos',
        bio: landingMentors[1].biography,
        user_id: landingMentorUsers[1].id,
      });
      await Speaker.create({
        event_id: event.id,
        session_id: landingSessions[2].id,
        name: landingMentors[2].name,
        role: landingMentors[2].job_title,
        company: landingMentors[2].company,
        topic: 'O próximo passo depois da contratação',
        bio: landingMentors[2].biography,
        user_id: landingMentorUsers[2].id,
      });

      // ── REGISTRATIONS (organizer + all mentors + all mentees) ──
      const allUsers = [organizer, ...mentorUsers, ...menteeUsers];
      for (const user of allUsers) {
        await Registration.create({
          event_id: event.id,
          user_id: user.id,
          ticket_code: 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
          status: 'registered',
        });
      }

      // ── BOOKINGS (mentees booking masterclasses) ────────────
      for (const mentee of menteeUsers) {
        for (const session of landingSessions) {
          await Booking.create({
            user_id: mentee.id,
            session_id: session.id,
          });
        }
      }

      // ── WISHES (mentees wishing for mentors) ────────────────
      for (let m = 0; m < menteeUsers.length; m++) {
        const mentee = menteeUsers[m];
        const numWishes = Math.min(3, mentorUsers.length);
        for (let i = 0; i < numWishes; i++) {
          const mentor = mentorUsers[(m + i) % mentorUsers.length];
          await Wish.create({
            mentee_id: mentee.id,
            mentor_id: mentor.id,
            event_id: event.id,
          });
        }
      }

      // ── MATCHES (only for completed rounds) ─────────────────
      for (const round of rounds) {
        if (round.status === 'done') {
          for (let j = 0; j < menteeUsers.length; j++) {
            const mentee = menteeUsers[j];
            const mentor = mentorUsers[j % mentorUsers.length];
            await Match.create({
              round_id: round.id,
              table_no: (j % 10) + 1,
              mentor_id: mentor.id,
              mentee_ids: [mentee.id],
              score: Math.floor(Math.random() * 40) + 60,
            });
          }
        }
      }

      // ── FEEDBACK (after completed matches) ──────────────────
      const completedRounds = rounds.filter((r) => r.status === 'done');
      const matches = [];
      for (const round of completedRounds) {
        const roundMatches = await Match.findAll({ where: { round_id: round.id } });
        matches.push(...roundMatches);
      }
      for (const match of matches) {
        await Feedback.create({
          match_id: match.id,
          from_user_id: match.mentee_ids[0],
          to_user_id: match.mentor_id,
          wants_to_continue: Math.random() > 0.3,
          usefulness: Math.floor(Math.random() * 5) + 1,
          private_note: 'Boa conversa, aprendi muito.',
        });
      }

      // ── CONNECTIONS (mutual connections) ────────────────────
      for (let i = 0; i < menteeUsers.length; i++) {
        const mentee = menteeUsers[i];
        const mentor = mentorUsers[i % mentorUsers.length];
        await Connection.create({
          user_a: mentee.id,
          user_b: mentor.id,
          origin: 'mutual',
        });
      }

      // ── MENTORSHIP REQUESTS ─────────────────────────────────
      const mIdx = (n) => menteeUsers[n % menteeUsers.length];
      const tIdx = (n) => mentorUsers[n % mentorUsers.length];
      await MentorshipRequest.create({
        mentee_id: mIdx(0).id,
        mentor_id: tIdx(0).id,
        status: 'accepted',
        message: 'Olá, gostava de ter o teu apoio como mentor.',
        decided_at: new Date(),
      });
      await MentorshipRequest.create({
        mentee_id: mIdx(1).id,
        mentor_id: tIdx(1).id,
        status: 'pending',
        message: 'Olá, gostava de ter o teu apoio como mentor.',
      });
      await MentorshipRequest.create({
        mentee_id: mIdx(2).id,
        mentor_id: tIdx(2).id,
        status: 'declined',
        message: 'Olá, gostava de ter o teu apoio.',
        decided_at: new Date(),
      });

      // ── MESSAGES (within connections) ───────────────────────
      const connections = await Connection.findAll();
      for (const conn of connections) {
        await Message.create({
          connection_id: conn.id,
          from_user_id: conn.user_a,
          body: 'Olá! Foi bom conhecer-te no evento.',
          read_at: new Date(),
        });
        await Message.create({
          connection_id: conn.id,
          from_user_id: conn.user_b,
          body: 'Olá! Também gostei de falar contigo.',
          read_at: new Date(),
        });
      }

      // ── QUESTIONS (for sessions) ────────────────────────────
      for (const session of landingSessions) {
        await Question.create({
          session_id: session.id,
          user_id: mIdx(0).id,
          body: 'Como posso destacar o meu CV para a primeira vaga?',
          anonymous: false,
          status: 'visible',
          projected: false,
        });
        await Question.create({
          session_id: session.id,
          user_id: mIdx(1).id,
          body: 'Quais habilidades são mais valorizadas no mercado atual?',
          anonymous: true,
          status: 'visible',
          projected: false,
        });
      }

      // ── POLLS (for sessions) ────────────────────────────────
      const poll = await Poll.create({
        session_id: breakSessions[0].id,
        question: 'Maior obstáculo na busca de emprego?',
        options: OBSTACLES,
      });

      // ── POLL VOTES ──────────────────────────────────────────
      for (const mentee of menteeUsers) {
        await PollVote.create({
          poll_id: poll.id,
          user_id: mentee.id,
          option_index: Math.floor(Math.random() * OBSTACLES.length),
        });
      }

      // ── ANNOUNCEMENTS ───────────────────────────────────────
      {/**   await Announcement.create({
        event_id: event.id,
        body: 'Bem-vindos ao Career Connect 2026! O evento começa às 14H00.',
        sent_by: organizer.id,
        sent_at: new Date(),
      });
      await Announcement.create({
        event_id: event.id,
        body: 'O intervalo de networking começa daqui a 10 minutos. Dirigam-se às mesas.',
        sent_by: organizer.id,
        sent_at: new Date(),
      }); */}

      // ── NOTIFICATIONS ───────────────────────────────────────
      for (const user of allUsers) {
        await Notification.create({
          user_id: user.id,
          channel: 'app',
          template: 'welcome',
          payload: { event: 'Career Connect 2026' },
          status: 'sent',
          sent_at: new Date(),
        });
      }

      // ── SURVEY RESPONSES ────────────────────────────────────
      for (const user of allUsers) {
        await SurveyResponse.create({
          user_id: user.id,
          event_id: event.id,
          rating: Math.floor(Math.random() * 3) + 3,
          nps: Math.floor(Math.random() * 11),
          comment: 'Evento muito útil para a minha carreira.',
        });
      }

      // ── NEXT STEPS ──────────────────────────────────────────
      for (const mentee of menteeUsers) {
        await NextStep.create({
          user_id: mentee.id,
          text: 'Enviar CV para pelo menos 3 empresas esta semana.',
          due_date: new Date('2026-12-11T00:00:00+02:00'),
        });
        await NextStep.create({
          user_id: mentee.id,
          text: 'Atualizar perfil do LinkedIn com novas competências.',
          due_date: new Date('2026-12-18T00:00:00+02:00'),
        });
      }

      // ── BADGES ──────────────────────────────────────────────
      await Badge.create({ user_id: mIdx(0).id, code: 'PRIMEIRA_LIGACAO' });
      await Badge.create({ user_id: mIdx(0).id, code: 'MEIO_CAMINHO' });
      await Badge.create({ user_id: mIdx(1).id, code: 'PRIMEIRA_LIGACAO' });
      await Badge.create({ user_id: tIdx(0).id, code: 'MENTORIA_ATIVA' });

      // ── AUDIT LOGS ──────────────────────────────────────────
      await AuditLog.create({
        actor_id: organizer.id,
        action: 'create_event',
        entity: 'Event',
        entity_id: event.id,
      });
      await AuditLog.create({
        actor_id: mIdx(0).id,
        action: 'register',
        entity: 'Registration',
        entity_id: mIdx(0).id,
      });
    }

    console.log('Seed data created successfully.');
    console.log('');
    console.log(`Mentors: ${mentorUsers.length} (${landingMentorUsers.length} landing + ${MENTOR_COUNT} generated)`);
    console.log(`Mentees: ${menteeUsers.length}`);
    console.log('');
    console.log('Accounts:');
    console.log('  Organizer: organizador@careerconnect.co.mz / Organizer123!');
    console.log(`  Mentor:    ${landingMentorUsers[0].email} / Mentor123!`);
    console.log(`  Mentee:    ${menteeUsers[0].email} / Mentee123!`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();