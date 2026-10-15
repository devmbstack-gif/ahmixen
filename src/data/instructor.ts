/**
 * All details come from the founder. Confirm title, spellings and numbers before launch.
 */

export type InstructorStat = {
  value: number;
  suffix: string;
  label: string;
  visible: boolean;
  /** Show label as the main line (no animated number). */
  textOnly?: boolean;
};

export type ProofPlatform = 'linkedin' | 'instagram' | 'youtube' | 'other';

export type InstructorProofCard = {
  imageAssetId: string;
  platform: ProofPlatform;
  href: string;
  label: string;
};

export type InstructorProofCardPublic = {
  imageUrl: string;
  platform: ProofPlatform;
  href: string;
  label: string;
};

export type Instructor = {
  name: string;
  /** Home instructor greeting (large headline). */
  greeting: string;
  /** Substring of `greeting` rendered in purple accent (e.g. I'm). */
  greetingAccent: string;
  /**
   * Full second headline line under the greeting.
   * Accent portion is highlighted via `headlineAccent`.
   */
  headlineSub: string;
  /** Substring of `headlineSub` rendered in purple accent. */
  headlineAccent: string;
  title: string;
  bio: string;
  shortBio: string;
  chip: string;
  /** @deprecated Prefer differenceBody — kept for CMS backward compat. */
  missionQuote: string;
  /** Sub-heading for the “what makes me different” block. */
  differenceHeading: string;
  /** Body copy under differenceHeading. */
  differenceBody: string;
  stats: InstructorStat[];
  seminars: {
    label: string;
    places: string[];
  };
  linkedin: string;
  instagram: string;
  photo: string;
  /** Resolved profile picture cards for the home instructor section. */
  proofCards: InstructorProofCardPublic[];
};

export const DEFAULT_INSTRUCTOR_GREETING = "Hello I'm AHMI";

/** Substring of the greeting rendered in purple accent (e.g. I'm). */
export const DEFAULT_GREETING_ACCENT = "I'm";

export const DEFAULT_HEADLINE_ACCENT = '100+ STUDENTS';

export const DEFAULT_HEADLINE_SUB =
  'TRAINED 100+ STUDENTS & DELIVERED KEYNOTE AI SEMINARS ACROSS UNIVERSITIES';

export const DEFAULT_DIFFERENCE_HEADING = 'What makes me different is simple:';

export const DEFAULT_DIFFERENCE_BODY =
  'As an active participant in the AI and startup ecosystem, I teach the practical, industry-demanded frameworks for building real-world Agentic AI workflows. My goal is to equip you with the skills to start building and monetizing AI immediately.';

export const DEFAULT_INSTRUCTOR_BIO =
  'Ahmi teaches AI and agentic AI to university students and young people. As Chief AI Officer and Founder at AhmiXen, he has delivered hands-on AI and Agentic AI training to over 100+ students, with keynotes and workshops at Mukabbir University of Gujrat, TechnoCrats College, Comrade College, and more.';

export const instructor: Instructor = {
  name: 'Ahmi',
  greeting: DEFAULT_INSTRUCTOR_GREETING,
  greetingAccent: DEFAULT_GREETING_ACCENT,
  headlineSub: DEFAULT_HEADLINE_SUB,
  headlineAccent: DEFAULT_HEADLINE_ACCENT,
  title: 'Chief AI Officer | Founder @ AhmiXen AI Agency',
  bio: DEFAULT_INSTRUCTOR_BIO,
  shortBio:
    'Ahmi teaches AI and agentic AI to university students and young people.',
  chip: 'AI and Agentic AI for students and youth',
  missionQuote: DEFAULT_DIFFERENCE_BODY,
  differenceHeading: DEFAULT_DIFFERENCE_HEADING,
  differenceBody: DEFAULT_DIFFERENCE_BODY,
  stats: [
    { value: 3, suffix: '+', label: 'Years of Experience', visible: true },
    { value: 100, suffix: '+', label: 'Students Trained', visible: true },
    { value: 10, suffix: '+', label: 'Awards & Honors', visible: true },
    {
      value: 0,
      suffix: '',
      label: 'Keynote Speaker at Top Universities',
      visible: true,
      textOnly: true,
    },
  ],
  seminars: {
    label: 'Seminars at',
    places: [
      'Mukabbir University of Gujrat',
      'TechnoCrats College',
      'Comrade College',
      'and more',
    ],
  },
  linkedin: 'https://www.linkedin.com/in/hafizahmadali',
  instagram: 'https://www.instagram.com/ahmimindset',
  /** Same path as the landing Instructor section photo */
  photo: '/pic 1.jpeg',
  proofCards: [],
};

export const visibleInstructorStats = instructor.stats.filter((s) => s.visible);

export function platformCaption(platform: ProofPlatform): string {
  switch (platform) {
    case 'linkedin':
      return 'LinkedIn';
    case 'instagram':
      return 'Instagram';
    case 'youtube':
      return 'YouTube';
    default:
      return 'Link';
  }
}

/** Split text into before / accent / after for purple highlight rendering. */
export function splitHeadlineAccent(
  headline: string,
  accent: string
): { before: string; accent: string; after: string } | null {
  const h = headline.trim();
  const a = accent.trim();
  if (!h || !a) return null;
  const idx = h.toUpperCase().indexOf(a.toUpperCase());
  if (idx < 0) return null;
  return {
    before: h.slice(0, idx),
    accent: h.slice(idx, idx + a.length),
    after: h.slice(idx + a.length),
  };
}
