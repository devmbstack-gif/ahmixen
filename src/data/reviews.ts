/**
 * Placeholder reviews. Replace with real approved reviews before launch.
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

export const REVIEWS: Review[] = [
  {
    id: 't1',
    name: 'Sarah Jenkins',
    role: 'Founder',
    text: 'Clear, practical, and straight to the point. I finally know what to focus on with AI.',
    rating: 5,
    featured: true,
    status: 'approved',
  },
  {
    id: 't2',
    name: 'Tariq Mehmood',
    role: 'Software Engineer',
    text: 'No fluff. Real agent workflows I could apply the same week at work.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 't3',
    name: 'Elena Rostova',
    role: 'Marketing Lead',
    text: 'I have zero coding background and still left with something useful running.',
    rating: 5,
    featured: false,
    status: 'approved',
  },
  {
    id: 't4',
    name: 'Marcus Chen',
    role: 'Product Designer',
    text: 'Best few hours I’ve spent learning AI. Simple explanations, real demos.',
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
