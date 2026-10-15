/**
 * Static review fallbacks for the public site when the testimonials
 * collection is empty. Prefer managing real reviews from Admin → Testimonials.
 * These workshop-style quotes also seed via `npm run seed:content`.
 */

export type ReviewStatus = 'approved' | 'pending' | 'hidden';

export type Review = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  featured: boolean;
  status: ReviewStatus;
  /** Optional — YouTube / Vimeo / direct .mp4|.webm URL */
  videoUrl?: string;
  /** Optional custom poster; falls back to provider thumbnail */
  thumbnail?: string;
};

export const LANDING_REVIEW_LIMIT = 4;

/** Workshop-style attendee reviews (Live Online Workshop). */
export const REVIEWS: Review[] = [
  {
    id: 'rev-sarah',
    name: 'Sarah Jenkins',
    role: 'Founder',
    text: 'Clear, practical, and straight to the point. I finally know what to focus on with AI — and I left with workflows I could use the same day.',
    rating: 5,
    featured: true,
    status: 'approved',
  },
  {
    id: 'rev-tariq',
    name: 'Tariq Mehmood',
    role: 'Software Engineer',
    text: 'No fluff. Real agent workflows and automation patterns I applied at work the same week. Best live AI session I have joined.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 'rev-elena',
    name: 'Elena Rostova',
    role: 'Marketing Lead',
    text: 'I have zero coding background and still left with something useful running. Ahmi explains Agentic AI in plain words.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 'rev-marcus',
    name: 'Marcus Chen',
    role: 'Product Designer',
    text: 'Best few hours I have spent learning AI. Simple explanations, real demos, and a clear path from learning to monetizing skills.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 'rev-ayesha',
    name: 'Ayesha Noor',
    role: 'Freelance Creator',
    text: 'The viral trend finder and content automation pieces alone were worth it. I started packaging AI services for clients within days.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 'rev-hamza',
    name: 'Hamza Raja',
    role: 'Student & Freelancer',
    text: 'This workshop gave me a clear framework for building AI agents. I set up my freelancing profile to deliver AI solutions after the session.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 'rev-fatima',
    name: 'Fatima Khan',
    role: 'Small Business Owner',
    text: 'I came for AI basics and left with a roadmap to automate repetitive work in my business. Practical, beginner-friendly, and actionable.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 'rev-bilal',
    name: 'Bilal Ahmed',
    role: 'Agency Owner',
    text: 'The skills-to-income module was gold. Clear freelancing and retainer angles for selling AI automations to local businesses.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
];

/** Landing section source — swap for a DB query later; UI stays the same. */
export function getLandingReviews(): Review[] {
  const approved = REVIEWS.filter((r) => r.status === 'approved');
  if (approved.length === 0) return [];

  const sorted = [...approved].sort((a, b) => {
    if (a.featured === b.featured) return 0;
    return a.featured ? -1 : 1;
  });

  return sorted.slice(0, LANDING_REVIEW_LIMIT);
}

/** Full testimonials page — swap for a DB query later; UI stays the same. */
export function getAllReviews(): Review[] {
  const approved = REVIEWS.filter((r) => r.status === 'approved');
  const featured = approved.filter((r) => r.featured);
  const rest = approved.filter((r) => !r.featured);
  return [...featured, ...rest];
}
