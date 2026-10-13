import { instructor } from './instructor';

export interface WorkshopInfo {
  brandName: string;
  tagline: string;
  badgeText: string;
  titlePrefix: string;
  titleDuration: string;
  titleHighlight: string;
  titleSuffix: string;
  calloutQuestion: string;
  calloutAnswer: string;
  date: string;
  dateShort: string;
  time: string;
  /** ISO 8601 start time (PKT / Asia/Karachi) */
  startsAt: string;
  durationLabel: string;
  sessionLabel: string;
  duration: string;
  deliveryFormat: string;
  level: string;
  seatsTotal: number;
  seatsRemaining: number;
  priceEarlyBird: {
    amount: string;
    original: string;
    currency: string;
    label: string;
    savings: string;
  };
  priceStandard: {
    amount: string;
    currency: string;
    label: string;
  };
  contactEmail: string;
  /** International WhatsApp number, digits only (country code + number, no +) */
  whatsappNumber: string;
  whatsappPrefill: string;
}

export const WORKSHOP_CONFIG: WorkshopInfo = {
  brandName: 'AhmiXen',
  tagline: 'Practical AI for real work',
  badgeText: 'Live AI Workshop',
  titlePrefix: 'Join Our',
  titleDuration: '2.5-Hour Live',
  titleHighlight: 'AI Workshop',
  titleSuffix: '',
  calloutQuestion: 'No heavy tech background?',
  calloutAnswer: 'No problem.',
  date: 'Saturday, October 24, 2026',
  dateShort: 'Oct 24, 2026',
  time: '7:00 PM PKT',
  startsAt: '2026-10-24T19:00:00+05:00',
  duration: '2.5 Hours Live',
  durationLabel: '2.5 Hours',
  sessionLabel: 'Live Session',
  deliveryFormat: 'Live Online',
  level: 'Beginner friendly',
  seatsTotal: 100,
  seatsRemaining: 18,
  priceEarlyBird: {
    amount: '$29',
    original: '$79',
    currency: 'USD',
    label: 'Early Bird Pass',
    savings: 'Save 63%',
  },
  priceStandard: {
    amount: '$59',
    currency: 'USD',
    label: 'Standard Registration',
  },
  contactEmail: 'info@ahmixen.com',
  whatsappNumber: '923390212102',
  whatsappPrefill:
    "Hi AhmiXen! I'd like to know more about the live AI workshop.",
};

export interface BenefitItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

export const WORKSHOP_BENEFITS: BenefitItem[] = [
  {
    id: 'fundamentals',
    iconName: 'Cpu',
    title: 'AI Fundamentals',
    description: 'Understand how modern AI works and write prompts that get reliable results.',
  },
  {
    id: 'agents',
    iconName: 'Bot',
    title: 'AI Agents',
    description: 'See how agents can research, use tools, and complete multi-step tasks for you.',
  },
  {
    id: 'automation',
    iconName: 'Sparkles',
    title: 'Automation',
    description: 'Connect AI to your daily tools and automate repetitive work with simple workflows.',
  },
  {
    id: 'building',
    iconName: 'Code2',
    title: 'Build with AI',
    description: 'Create small apps and tools with AI assistance — without a heavy coding background.',
  },
];

export interface LandingStat {
  id: string;
  value: number;
  decimals?: number;
  suffix: string;
  prefix?: string;
  label: string;
}

export const LANDING_STATS: LandingStat[] = [
  {
    id: 'trained',
    value: instructor.stats.find((s) => s.label === 'students trained')?.value ?? 100,
    suffix: instructor.stats.find((s) => s.label === 'students trained')?.suffix ?? '+',
    label: 'Students trained',
  },
  { id: 'hours', value: 2.5, decimals: 1, suffix: 'h', label: 'Live workshop' },
  { id: 'rating', value: 4.9, decimals: 1, suffix: '★', label: 'Average rating' },
  { id: 'modules', value: 4, suffix: '', label: 'Hands-on modules' },
];

export type BentoSpan = 'lg' | 'md' | 'sm' | 'wide';

export interface BentoFeature {
  id: string;
  iconName: string;
  title: string;
  description: string;
  span: BentoSpan;
  accent?: string;
}

export const BENTO_FEATURES: BentoFeature[] = [
  {
    id: 'fundamentals',
    iconName: 'Cpu',
    title: 'AI Fundamentals',
    description:
      'How modern models work, when to use them, and prompt patterns that get reliable results every time.',
    span: 'lg',
    accent: 'from-violet-500/25 to-transparent',
  },
  {
    id: 'agents',
    iconName: 'Bot',
    title: 'AI Agents',
    description: 'Watch agents research, use tools, and finish multi-step work while you supervise.',
    span: 'md',
    accent: 'from-fuchsia-500/20 to-transparent',
  },
  {
    id: 'automation',
    iconName: 'Sparkles',
    title: 'Automation',
    description: 'Wire AI into the tools you already use — less busywork, more output.',
    span: 'md',
    accent: 'from-sky-500/20 to-transparent',
  },
  {
    id: 'building',
    iconName: 'Code2',
    title: 'Build with AI',
    description: 'Ship a small working tool in-session — no heavy coding background required.',
    span: 'wide',
    accent: 'from-purple-500/25 to-transparent',
  },
  {
    id: 'live-qa',
    iconName: 'MessageCircle',
    title: 'Live Q&A',
    description: 'Ask anything. Get answers in real time.',
    span: 'sm',
    accent: 'from-rose-500/15 to-transparent',
  },
  {
    id: 'certificate',
    iconName: 'Award',
    title: 'Certificate',
    description: 'Proof you completed the AhmiXen live workshop.',
    span: 'sm',
    accent: 'from-amber-500/15 to-transparent',
  },
];

export const TRUST_LOGOS: { id: string; name: string }[] = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'claude', name: 'Claude' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'n8n', name: 'n8n' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'notion', name: 'Notion' },
  { id: 'zapier', name: 'Zapier' },
  { id: 'midjourney', name: 'Midjourney' },
];

export interface AgendaModule {
  id: string;
  moduleNumber: string;
  timeRange: string;
  durationMin: string;
  title: string;
  summary: string;
}

export const WORKSHOP_AGENDA: AgendaModule[] = [
  {
    id: 'module-1',
    moduleNumber: '01',
    timeRange: '0:00 – 0:35',
    durationMin: '35 min',
    title: 'AI Fundamentals',
    summary: 'What AI actually is, essential tools, and prompt patterns that work in real tasks.',
  },
  {
    id: 'module-2',
    moduleNumber: '02',
    timeRange: '0:35 – 1:10',
    durationMin: '35 min',
    title: 'AI Agents',
    summary: 'How agents plan, use tools, and run tasks automatically — with a live walkthrough.',
  },
  {
    id: 'module-3',
    moduleNumber: '03',
    timeRange: '1:10 – 1:45',
    durationMin: '35 min',
    title: 'Automation Workflows',
    summary: 'Build simple automated pipelines that save hours of manual follow-up and busywork.',
  },
  {
    id: 'module-4',
    moduleNumber: '04',
    timeRange: '1:45 – 2:30',
    durationMin: '45 min',
    title: 'Build with AI + Q&A',
    summary: 'Create a small working prototype with AI, then open Q&A for your questions.',
  },
];

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatarInitials: string;
  gradient: string;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    name: 'Sarah Jenkins',
    role: 'Founder',
    quote: 'Clear, practical, and straight to the point. I finally know what to focus on with AI.',
    rating: 5,
    avatarInitials: 'SJ',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 't2',
    name: 'Tariq Mehmood',
    role: 'Software Engineer',
    quote: 'No fluff. Real agent workflows I could apply the same week at work.',
    rating: 5,
    avatarInitials: 'TM',
    gradient: 'from-violet-600 to-purple-800',
  },
  {
    id: 't3',
    name: 'Elena Rostova',
    role: 'Marketing Lead',
    quote: 'I have zero coding background and still left with something useful running.',
    rating: 5,
    avatarInitials: 'ER',
    gradient: 'from-fuchsia-600 to-purple-600',
  },
  {
    id: 't4',
    name: 'Marcus Chen',
    role: 'Product Designer',
    quote: 'Best few hours I’ve spent learning AI. Simple explanations, real demos.',
    rating: 5,
    avatarInitials: 'MC',
    gradient: 'from-purple-600 to-violet-500',
  },
];

export interface InstructorProfile {
  name: string;
  title: string;
  bio: string;
  highlights: string[];
  photo: string;
  linkedinUrl: string;
  instagramUrl: string;
}

export const INSTRUCTOR_DATA: InstructorProfile = {
  name: instructor.name,
  title: instructor.title,
  bio: instructor.bio,
  highlights: [
    ...instructor.stats
      .filter((s) => s.visible)
      .map((s) => `${s.value}${s.suffix} ${s.label}`),
    instructor.chip,
  ],
  photo: instructor.photo,
  linkedinUrl: instructor.linkedin,
  instagramUrl: instructor.instagram,
};

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Do I need coding experience?',
    answer:
      'No. The session is beginner-friendly. We use clear demos and tools that work for non-technical professionals too.',
  },
  {
    id: 'faq-2',
    question: 'What if I miss the live session?',
    answer:
      'You get access to the full recording and materials after the workshop so you can catch up anytime.',
  },
  {
    id: 'faq-3',
    question: 'What do I need to join?',
    answer:
      'A laptop and a modern browser. Setup tips for free tool accounts are shared after you reserve your seat.',
  },
  {
    id: 'faq-4',
    question: 'Will I get a certificate?',
    answer:
      'Yes. Completing the workshop includes an AhmiXen certificate of completion you can add to your profile.',
  },
  {
    id: 'faq-5',
    question: 'How is this different from YouTube?',
    answer:
      'You get a live, structured session with real demos and Q&A — not scattered tutorials or hype clips.',
  },
  {
    id: 'faq-6',
    question: 'What is the refund policy?',
    answer:
      'If you attend live and feel it wasn’t valuable, email workshops@ahmixen.com within 7 days for a full refund.',
  },
];
