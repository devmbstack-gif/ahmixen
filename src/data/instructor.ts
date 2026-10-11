/**
 * All details come from the founder. Confirm title, spellings and numbers before launch.
 */

export type InstructorStat = {
  value: number;
  suffix: string;
  label: string;
  visible: boolean;
};

export type Instructor = {
  name: string;
  title: string;
  bio: string;
  shortBio: string;
  chip: string;
  stats: InstructorStat[];
  seminars: {
    label: string;
    places: string[];
  };
  linkedin: string;
  instagram: string;
  photo: string;
};

export const instructor: Instructor = {
  name: 'Hafiz Ahmad Ali',
  title: 'Chief AI Officer · Founder, AhmiXen',
  bio: 'Hafiz Ahmad Ali teaches AI and agentic AI to university students and young people. Practical, hands-on and built for beginners, so you can use AI at work the same day.',
  shortBio:
    'Founder of the AI agency AhmiXen. He teaches AI and agentic AI to university students and young people.',
  chip: 'AI and Agentic AI for students and youth',
  stats: [
    { value: 3, suffix: '+', label: 'years of experience', visible: true },
    { value: 100, suffix: '+', label: 'students trained', visible: true },
    // Set visible to true only after the award certificates are received.
    { value: 10, suffix: '+', label: 'awards', visible: false },
  ],
  // CONFIRM THE EXACT COLLEGE AND UNIVERSITY NAMES WITH THE FOUNDER.
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
};

export const visibleInstructorStats = instructor.stats.filter((s) => s.visible);
