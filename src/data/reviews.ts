/**
 * Static review fallbacks for the public site when the testimonials
 * collection is empty. Keep this array empty in production — manage
 * real reviews from Admin → Testimonials.
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

/** No placeholder reviews — production content comes from the database. */
export const REVIEWS: Review[] = [];

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
