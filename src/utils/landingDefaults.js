'use strict';

// Default landing page content. Structure mirrors Landingpage.jsx exactly.
const DEFAULT_LANDING_CONFIG = {
  event: {
    dateLabel: '04 de Dezembro de 2026',
    timeLabel: 'Início às 14H00',
    locationLabel: 'Hotel Cardoso | Maputo',
    startAt: '2026-12-04T14:00:00+02:00',
    venue: 'Hotel Cardoso',
    venueFull: 'Hotel Cardoso, Maputo',
    mapQuery: 'Hotel Cardoso Maputo',
    calendarStart: '20261204T120000Z',
    calendarEnd: '20261204T150000Z',
  },
  tutorialVideoUrl: '',
  axes: [
    { title: 'Preparação para o Mercado de Trabalho', items: ['Estratégias de procura de emprego', 'Construção de CV', 'Preparação para entrevistas'] },
    { title: 'Posicionamento e Oportunidades', items: ['Marca pessoal & Comunicação profissional', 'LinkedIn e presença digital', 'Networking estratégico e desenvolvimento de conexões profissionais', 'Identificação e valorização de competências no mercado'] },
    { title: 'Desenvolvimento e Crescimento na Carreira', items: ['Adaptação à cultura e ao ambiente organizacional', 'Postura profissional, responsabilidade e desempenho', 'Aprendizagem contínua, proactividade e planeamento de carreira'] },
  ],
  benefits: [
    { title: 'Encontrar um Mentor', text: 'Identifica profissionais experientes que podem orientar a tua jornada profissional.' },
    { title: 'Construir Conexões Profissionais', text: 'Expande a tua rede de contactos através de networking estratégico.' },
    { title: 'Participar em 4 Conversas Estratégicas', text: 'Interage com diferentes profissionais durante sessões rápidas de networking.' },
    { title: 'Transformar Contactos em Oportunidades', text: 'Estabelece relações que poderão evoluir para mentoria, estágios ou oportunidades profissionais.' },
    { title: 'Aprender com Líderes e Especialistas', text: 'Obtém conhecimentos práticos sobre empregabilidade, carreira e desenvolvimento pessoal.' },
  ],
  faqs: [
    { q: 'O que é o Career Connect?', a: 'É uma iniciativa da TECNICOL que conecta estudantes finalistas e jovens profissionais a executivos e especialistas de diversas áreas, através de um fórum presencial de capacitação, networking e um programa estruturado de mentoria.' },
    { q: 'Quem pode participar?', a: 'O programa destina-se a estudantes finalistas universitários e do ensino técnico-profissional e jovens profissionais, que procuram a sua inserção no mercado de trabalho, bem como a profissionais experientes interessados em contribuir para o desenvolvimento da próxima geração de talentos, atuando como mentores.' },
    { q: 'A participação tem algum custo?', a: 'As condições variam em cada evento. A 1ª edição é grátis, mas serão selecionados os graduados e mentores com o perfil mais adequado para os objectivos desta edição. Após o registo, a organização terá 48 horas para validar a inscrição.' },
    { q: 'O que acontece durante o evento presencial?', a: 'Os participantes terão acesso a masterclasses com oradores de referência, dinâmicas de networking direcionado e momentos de interação direta com profissionais e mentores experientes.' },
    { q: 'Como funciona o processo de mentoria?', a: 'Após a fase de candidatura, a organização realiza um processo de matching inteligente, ligando mentorados e mentores de acordo com os objetivos profissionais, interesses e áreas de competência, reduzindo a dependência dos modelos tradicionais de seleção baseados apenas em CVs.' },
    { q: 'Ser selecionado garante um emprego ou estágio?', a: 'Não. O Career Connect não garante oportunidades de emprego ou estágio. O objetivo é proporcionar orientação, desenvolvimento de competências e acesso a uma rede de contactos que aumente a empregabilidade e a preparação profissional dos participantes.' },
    { q: 'Como posso tornar-me mentor?', a: 'Os profissionais interessados devem preencher o formulário de candidatura para mentores, indicando a sua experiência, área de especialização e disponibilidade.' },
    { q: 'A mentoria termina no dia do evento?', a: 'Não. O evento presencial marca apenas o início do programa. Após o fórum, mentor e mentorado seguem um plano de acompanhamento com objetivos, desafios práticos e sessões periódicas de desenvolvimento.' },
  ],
};

module.exports = { DEFAULT_LANDING_CONFIG };