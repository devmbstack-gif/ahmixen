export interface WorkshopInfo {
  brandName: string;
  tagline: string;
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subtitle: string;
  date: string;
  time: string;
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
}

export const WORKSHOP_CONFIG: WorkshopInfo = {
  brandName: 'AhmiXen',
  tagline: 'Applied AI & Autonomous Agent Systems',
  badgeText: 'Live Interactive AI Workshop',
  titlePrefix: 'Master Practical AI &',
  titleHighlight: 'Autonomous Agents',
  titleSuffix: 'From Prompting to Production Workflows',
  subtitle:
    'A high-impact, hands-on masterclass designed for professionals, developers, and founders. Learn to leverage state-of-the-art LLMs, automate complex multi-step workflows, and build real AI systems without unnecessary jargon.',
  date: 'Saturday, October 24, 2026',
  time: '7:00 PM PKT / 2:00 PM GMT / 10:00 AM EST',
  duration: '2.5 Hours Live',
  deliveryFormat: 'Live Online • Interactive Cohort',
  level: 'Beginner to Intermediate Friendly',
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
  contactEmail: 'workshops@ahmixen.com',
};

export interface StatItem {
  id: string;
  value: string;
  label: string;
  detail: string;
}

export const COMMUNITY_STATS: StatItem[] = [
  {
    id: 'learners',
    value: '1,250+',
    label: 'Forward-Thinking Learners',
    detail: 'Founders, engineers, marketers & creators enrolled across cohorts',
  },
  {
    id: 'satisfaction',
    value: '98.6%',
    label: 'Workshop Recommendation Rate',
    detail: 'Rated highly by participants for real-world actionable value',
  },
  {
    id: 'tools',
    value: '15+',
    label: 'Cutting-Edge AI Tools Covered',
    detail: 'From agentic pipelines to multimodal content & vibe coding',
  },
  {
    id: 'projects',
    value: '3 Live',
    label: 'Production-Ready Blueprints',
    detail: 'Walk away with working workflows you can deploy immediately',
  },
];

export interface MarketInsight {
  source: string;
  metric: string;
  headline: string;
  description: string;
  tag: string;
}

export const MARKET_INSIGHTS: MarketInsight[] = [
  {
    source: 'World Economic Forum',
    metric: '44% of Core Skills',
    headline: 'Will change by 2027 due to Generative AI',
    description:
      'Professionals proficient in AI tools and autonomous systems are replacing repetitive manual execution across every industry sector.',
    tag: 'Future of Work',
  },
  {
    source: 'Goldman Sachs Global Economics',
    metric: '300M+ Workflows',
    headline: 'Transitioning to AI-Augmented Automation',
    description:
      'The biggest competitive advantage belongs to individuals who know how to command, orchestrate, and audit AI systems effectively.',
    tag: 'Economic Shift',
  },
  {
    source: 'Industry Benchmark 2026',
    metric: '10x Execution Speed',
    headline: 'Achieved by AI-Integrated Practitioners',
    description:
      'From rapid prototyping to automated research and marketing, AI-native operators deliver outcomes in hours that used to take weeks.',
    tag: 'Productivity Edge',
  },
];

export interface BenefitItem {
  id: string;
  iconName: string;
  badge: string;
  title: string;
  description: string;
  bullets: string[];
}

export const WORKSHOP_BENEFITS: BenefitItem[] = [
  {
    id: 'fundamentals',
    iconName: 'Cpu',
    badge: 'Foundations',
    title: 'AI Fundamentals & Advanced Prompting',
    description:
      'Demystify how modern frontier LLMs actually reason. Move far beyond trivial prompts to structured prompt architectures, chain-of-thought, and few-shot reasoning.',
    bullets: [
      'Master prompt architectures that prevent hallucinations',
      'Context window optimization & token economy techniques',
      'Evaluating model strengths: Claude 3.7, GPT-4o, DeepSeek, Gemini',
      'System prompts & structured output extraction (JSON/Schema)',
    ],
  },
  {
    id: 'agents',
    iconName: 'Bot',
    badge: 'Autonomous Systems',
    title: 'AI Agents & Workflow Automation',
    description:
      'Build autonomous agent loops that don’t just answer questions—they plan, execute tools, browse the web, and automate multi-step business pipelines.',
    bullets: [
      'Understanding agent loops, tool calling, and autonomous execution',
      'Connecting LLMs to APIs, databases, and webhook triggers',
      'Visual workflow orchestration with n8n & automated pipelines',
      'Deploying self-healing agents that audit and correct their own output',
    ],
  },
  {
    id: 'content',
    iconName: 'Sparkles',
    badge: 'Creative Production',
    title: 'AI-Powered Creative & Content Systems',
    description:
      'Harness multimodal AI models to generate high-converting copy, design assets, marketing campaigns, and video scripts at unprecedented scale.',
    bullets: [
      'High-fidelity image generation & brand style preservation',
      'Multimodal analysis for competitors, docs, and visual media',
      'Content repurposing pipelines: turn 1 concept into 10 multi-channel assets',
      'Prompt libraries for copywriting, pitch decks, and brand voice consistency',
    ],
  },
  {
    id: 'vibe-coding',
    iconName: 'Code2',
    badge: 'Building Live',
    title: 'Building Real Applications with AI',
    description:
      'Experience the revolution of "vibe coding" and AI-assisted development. Build interactive prototypes, functional tools, and mini web apps in minutes.',
    bullets: [
      'AI coding assistants: Cursor, Windsurf, Claude Code, and Copilot',
      'Rapid UI prototyping with modern web frameworks and AI generators',
      'Building custom internal tools and micro-SaaS prototypes',
      'Debugging, testing, and shipping without getting bogged down in boilerplate',
    ],
  },
];

export interface AgendaModule {
  id: string;
  moduleNumber: string;
  timeRange: string;
  durationMin: string;
  title: string;
  tagline: string;
  summary: string;
  keyTopics: string[];
  handsOnDeliverable: string;
  toolsUsed: string[];
}

export const WORKSHOP_AGENDA: AgendaModule[] = [
  {
    id: 'module-1',
    moduleNumber: '01',
    timeRange: '00:00 - 00:35',
    durationMin: '35 min',
    title: 'Foundations & The Modern AI Frontier',
    tagline: 'Deconstructing frontier models and prompt engineering frameworks',
    summary:
      'Understand the architecture of state-of-the-art models. Learn how to craft bulletproof prompts, control output formats, and eliminate hallucination risks.',
    keyTopics: [
      'How modern LLMs reason: weights, context windows & tokenization',
      'The 4-part prompt blueprint for mission-critical tasks',
      'Few-shot prompting, dynamic role framing, and chain-of-thought',
      'Comparing model capabilities: when to use Claude vs GPT vs Gemini',
    ],
    handsOnDeliverable: 'Your Personal Production Prompt Playbook & Template Library',
    toolsUsed: ['Claude 3.7 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro', 'OpenAI Playground'],
  },
  {
    id: 'module-2',
    moduleNumber: '02',
    timeRange: '00:35 - 01:10',
    durationMin: '35 min',
    title: 'Autonomous AI Agents & Tool Calling',
    tagline: 'From conversational chatbots to agents that take action',
    summary:
      'Step into the agentic era. Explore how autonomous agents parse objectives, plan sequences, execute external tools, and verify outcomes.',
    keyTopics: [
      'Agent anatomy: perception, memory, tool orchestration, and reflection',
      'Real-world tool calling: web search, document parsing, and API triggers',
      'Building an autonomous research & summarization agent live',
      'Handling failure states, loops, and rate limits gracefully',
    ],
    handsOnDeliverable: 'Working Autonomous Research Agent with Web-Browsing Capabilities',
    toolsUsed: ['Agent Workflows', 'Tool Calling APIs', 'Perplexity', 'Custom Agents'],
  },
  {
    id: 'module-3',
    moduleNumber: '03',
    timeRange: '01:10 - 01:45',
    durationMin: '35 min',
    title: 'Multi-Step Workflow Automation with n8n',
    tagline: 'Building zero-maintenance automated pipelines for work and business',
    summary:
      'Connect your favorite apps and data sources with intelligent AI logic. Automate repetitive tasks like customer triage, lead qualification, and reporting.',
    keyTopics: [
      'Setting up automated triggers and webhooks with zero friction',
      'Integrating LLM processing nodes directly into business workflows',
      'Automating email synthesis, CRM updates, and notification routing',
      'Best practices for secure API key management and token budgeting',
    ],
    handsOnDeliverable: 'Deployable End-to-End Automated Workflow Pipeline',
    toolsUsed: ['n8n', 'Make / Webhooks', 'Google Workspace', 'Slack / Discord APIs'],
  },
  {
    id: 'module-4',
    moduleNumber: '04',
    timeRange: '01:45 - 02:15',
    durationMin: '30 min',
    title: 'Vibe Coding & Building Live AI Applications',
    tagline: 'Turning ideas into functioning software prototypes in minutes',
    summary:
      'Learn how to guide modern AI code generators to build frontend interfaces, utility tools, and micro-apps without getting lost in technical rabbit holes.',
    keyTopics: [
      'The vibe coding workflow: iteration cycles, context feeding, and reviews',
      'Building an interactive AI utility tool live on screen from scratch',
      'Styling with modern component libraries and fast preview environments',
      'Deploying your prototype live to the web in one click',
    ],
    handsOnDeliverable: 'Live Deployed Web Prototype Built with AI Coding Tools',
    toolsUsed: ['Cursor', 'v0 / Bolt', 'Tailwind CSS', 'Vite / Vercel'],
  },
  {
    id: 'module-5',
    moduleNumber: '05',
    timeRange: '02:15 - 02:30',
    durationMin: '15 min',
    title: 'Live Q&A, Career Roadmap & Next Steps',
    tagline: 'Interactive problem-solving, open mic, and your ongoing AI roadmap',
    summary:
      'Direct interaction with the instructor. Bring your personal workflows, business use cases, and technical challenges for tailored live guidance.',
    keyTopics: [
      'Live review of audience workflows and business ideas',
      'Recommended tech stacks for continuing your AI mastery',
      'Accessing the private AhmiXen community & future masterclasses',
      'Certificate claiming process & lifetime resource archive access',
    ],
    handsOnDeliverable: 'Tailored 30-Day AI Implementation Roadmap + Certificate Access',
    toolsUsed: ['Live Cohort Q&A', 'Community Hub', 'Resource Drive'],
  },
];

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  quote: string;
  rating: number;
  avatarInitials: string;
  gradient: string;
  verifiedCohort: string;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    name: 'Sarah Jenkins',
    role: 'Founder & Product Lead',
    organization: 'NovaTech Labs',
    quote:
      'The difference between watching random YouTube tutorials and seeing practical, production-level agent workflows built live is night and day. This workshop transformed how our entire startup approaches automation.',
    rating: 5,
    avatarInitials: 'SJ',
    gradient: 'from-purple-500 to-indigo-600',
    verifiedCohort: 'Batch 04 Participant',
  },
  {
    id: 't2',
    name: 'Tariq Mehmood',
    role: 'Senior Fullstack Engineer',
    organization: 'Enterprise Solutions',
    quote:
      'I was skeptical about another "AI overview", but AhmiXen dove straight into practical tool calling, structured JSON output, and n8n pipelines. Clear, fluff-free, and directly applicable to my daily engineering work.',
    rating: 5,
    avatarInitials: 'TM',
    gradient: 'from-violet-600 to-purple-800',
    verifiedCohort: 'Batch 03 Participant',
  },
  {
    id: 't3',
    name: 'Elena Rostova',
    role: 'Growth Marketing Director',
    organization: 'ScalePulse Media',
    quote:
      'I have zero coding background, yet I walked away with an automated content repurposing agent running seamlessly. The step-by-step breakdown was intuitive, respectful of non-developers, and incredibly empowering.',
    rating: 5,
    avatarInitials: 'ER',
    gradient: 'from-fuchsia-600 to-purple-600',
    verifiedCohort: 'Batch 04 Participant',
  },
  {
    id: 't4',
    name: 'Marcus Chen',
    role: 'Product Designer & Consultant',
    organization: 'Chen Studio',
    quote:
      'The vibe coding module alone was worth ten times the ticket price. Being able to conceptualize a tool and build an interactive prototype in under 30 minutes has completely changed how I pitch clients.',
    rating: 5,
    avatarInitials: 'MC',
    gradient: 'from-purple-600 to-violet-500',
    verifiedCohort: 'Batch 02 Participant',
  },
];

export interface InstructorProfile {
  name: string;
  title: string;
  roleDescription: string;
  bioParagraphs: string[];
  credentials: {
    label: string;
    value: string;
  }[];
  highlights: string[];
  socialLinks: {
    platform: string;
    url: string;
  }[];
}

export const INSTRUCTOR_DATA: InstructorProfile = {
  name: 'Ahmad Raza',
  title: 'Lead AI Practitioner & Founder, AhmiXen',
  roleDescription: 'AI Systems Architect • Educator • Automation Specialist',
  bioParagraphs: [
    'Ahmad Raza is an applied AI systems builder and educator focused on bridging the gap between cutting-edge frontier intelligence and everyday operational workflows.',
    'Over the past several years, Ahmad has engineered autonomous agent pipelines, guided hundreds of professionals through modern AI tooling, and built scalable automated systems that save teams thousands of hours of manual labor.',
    'His teaching philosophy is strictly hands-on and zero-fluff: no theoretical slide decks or hype, only battle-tested techniques, reproducible architectures, and practical skills you can deploy the same day.',
  ],
  credentials: [
    { label: 'Experience in Tech', value: '7+ Years' },
    { label: 'Trained Professionals', value: '1,200+' },
    { label: 'Automated Pipelines Built', value: '50+' },
    { label: 'Satisfaction Rating', value: '4.9 / 5.0' },
  ],
  highlights: [
    'Specialist in LLM tool calling, structured outputs & agentic loops',
    'Architect of high-efficiency n8n and webhook automation pipelines',
    'Advocate of accessible AI education for founders, engineers & non-tech creators',
    'Dedicated live mentor committed to student outcomes and real-world clarity',
  ],
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Twitter', url: 'https://x.com' },
    { platform: 'GitHub', url: 'https://github.com' },
    { platform: 'YouTube', url: 'https://youtube.com' },
  ],
};

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Prerequisites',
    question: 'Do I need prior coding or technical background to attend?',
    answer:
      'No! The workshop is intentionally structured to be accessible to non-technical professionals (founders, managers, marketers, designers) while remaining high-yield and practical for developers. We teach both visual no-code orchestrators (like n8n) and modern AI-assisted creation frameworks (vibe coding) that require zero prior syntax mastery.',
  },
  {
    id: 'faq-2',
    category: 'Session Format',
    question: 'What if I cannot attend the live session at the scheduled time?',
    answer:
      'Every registered participant receives lifetime access to the complete 4K HD workshop recording, timestamped chapter markers, slide decks, prompt templates, and workflow files within 24 hours of session completion. You can study at your own pace whenever suits your schedule.',
  },
  {
    id: 'faq-3',
    category: 'Tools & Requirements',
    question: 'What software or accounts will I need during the workshop?',
    answer:
      'All you need is a modern web browser and a laptop/desktop computer. We will use free or freely accessible tiers of leading tools (Claude, OpenAI, n8n cloud/self-hosted, Cursor/web playgrounds). Detailed account setup instructions and free starter templates are emailed to you immediately upon registration.',
  },
  {
    id: 'faq-4',
    category: 'Certification',
    question: 'Will I receive a certificate of completion?',
    answer:
      'Yes! After participating in the live session (or completing the recorded curriculum), you will be issued a verifiable AhmiXen AI Practitioner Certificate of Completion that you can add directly to your LinkedIn profile and professional resume.',
  },
  {
    id: 'faq-5',
    category: 'Value Proposition',
    question: 'How is this different from free YouTube tutorials and articles?',
    answer:
      'Most free tutorials show basic toy examples or outdated 2023 prompting tricks. In this workshop, you see real-world agent architectures, tool execution loops, error handling, and end-to-end production pipelines built live in real time, with an interactive Q&A format where you can get answers to your specific projects and questions.',
  },
  {
    id: 'faq-6',
    category: 'Community Access',
    question: 'What kind of post-workshop support do I receive?',
    answer:
      'You get an invitation to our private AhmiXen Discord Community where you can network with other alumni, collaborate on AI projects, receive ongoing updates as new frontier models launch, and ask questions directly to the instructor and teaching assistants.',
  },
  {
    id: 'faq-7',
    category: 'Guarantee',
    question: 'What is your refund policy?',
    answer:
      'We stand firmly behind the quality of our masterclass. If you attend the live workshop and feel that the content did not deliver practical, transformative value for your work, simply email workshops@ahmixen.com within 7 days for a 100% no-questions-asked refund.',
  },
];
