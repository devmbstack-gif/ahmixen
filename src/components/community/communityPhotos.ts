export type CommunityPhoto = {
  id: string;
  src: string;
  caption: string;
  /** Bento mosaic size on desktop */
  span: 'lg' | 'tall' | 'wide' | 'sm';
};

/** Same workshop photos + captions as before */
export const COMMUNITY_PHOTOS: CommunityPhoto[] = [
  {
    id: 'workshop-01',
    src: '/community/workshop-01.jpg',
    caption: 'Speaking at the Agentic AI & vibe coding workshop',
    span: 'lg',
  },
  {
    id: 'workshop-02',
    src: '/community/workshop-02.jpg',
    caption: 'Workshop hosts with Mukabbir University leadership',
    span: 'tall',
  },
  {
    id: 'workshop-03',
    src: '/community/workshop-03.jpg',
    caption: 'Live n8n automation demo on stage',
    span: 'sm',
  },
  {
    id: 'workshop-04',
    src: '/community/workshop-04.jpg',
    caption: 'AhmiXen speaking and training collage',
    span: 'wide',
  },
  {
    id: 'workshop-05',
    src: '/community/workshop-05.jpg',
    caption: 'Full room at the Agentic AI workshop',
    span: 'sm',
  },
  {
    id: 'workshop-06',
    src: '/community/workshop-06.jpg',
    caption: 'Audience during the live AI session',
    span: 'wide',
  },
  {
    id: 'workshop-07',
    src: '/community/workshop-07.jpg',
    caption: 'Instructor addressing the community',
    span: 'sm',
  },
];

/** Tiny purple-tinted placeholder for next/image blur */
export const COMMUNITY_BLUR_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#1a1028"/></svg>`
  );
