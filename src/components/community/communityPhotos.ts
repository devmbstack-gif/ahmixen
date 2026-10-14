export type CommunityPhoto = {
  id: string;
  src: string;
  caption: string;
  /** Bento mosaic size on desktop */
  span: 'lg' | 'tall' | 'wide' | 'sm';
  /** Face-friendly crop anchor for object-cover tiles */
  objectPosition?: string;
};

/**
 * Community gallery (workshop + WhatsApp).
 * Ordered for a dense 3-column mosaic: 3 tall + 1 lg + 3 wide + 2 sm = 18 cells.
 */
export const COMMUNITY_PHOTOS: CommunityPhoto[] = [
  {
    id: 'wa-portrait-1',
    src: '/community/WhatsApp Image 2026-10-13 at 9.49.56 PM.jpeg',
    caption: 'Instructor with workshop participants',
    span: 'tall',
    objectPosition: '50% 20%',
  },
  {
    id: 'workshop-02',
    src: '/community/workshop-02.jpg',
    caption: 'Workshop hosts with Mukabbir University leadership',
    span: 'lg',
    objectPosition: '50% 35%',
  },
  {
    id: 'workshop-03',
    src: '/community/workshop-03.jpg',
    caption: 'Live n8n automation demo on stage',
    span: 'sm',
    objectPosition: '50% 40%',
  },
  {
    id: 'workshop-05',
    src: '/community/workshop-05.jpg',
    caption: 'Full room at the Agentic AI workshop',
    span: 'sm',
    objectPosition: '50% 40%',
  },
  {
    id: 'workshop-07',
    src: '/community/workshop-07.jpg',
    caption: 'Instructor addressing the community',
    span: 'tall',
    objectPosition: '50% 22%',
  },
  {
    id: 'workshop-04',
    src: '/community/workshop-04.jpg',
    caption: 'AhmiXen speaking and training collage',
    span: 'wide',
    objectPosition: '50% 50%',
  },
  {
    id: 'workshop-06',
    src: '/community/workshop-06.jpg',
    caption: 'Audience during the live AI session',
    span: 'wide',
    objectPosition: '50% 40%',
  },
  {
    id: 'wa-portrait-2',
    src: '/community/WhatsApp Image 2026t .jpeg',
    caption: 'Hands-on training with students',
    span: 'tall',
    objectPosition: '50% 18%',
  },
  {
    id: 'wa-landscape-hero',
    src: '/community/WhatsApp Image 2026-10-1).jpeg',
    caption: 'Live community workshop session',
    span: 'wide',
    objectPosition: '50% 40%',
  },
];

/** Tiny purple-tinted placeholder for next/image blur */
export const COMMUNITY_BLUR_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#1a1028"/></svg>`
  );
