import { instructor } from './instructor';

export type ProgramCard = {
  id: string;
  title: string;
  instructor: string;
  badges: readonly string[];
  price: string;
  image: string;
  href: string;
};

/** Course catalog — add more cards here later */
export const PROGRAMS: readonly ProgramCard[] = [
  {
    id: 'course-1',
    title: 'AI Workshop',
    instructor: instructor.name,
    badges: ['2.5 Hours', 'Live Session'],
    price: '$29',
    image: '/course1.jpeg',
    href: '/#pricing',
  },
  {
    id: 'course-2',
    title: 'AI Workshop',
    instructor: instructor.name,
    badges: ['2.5 Hours', 'Live Session'],
    price: '$29',
    image: '/course2.jpeg',
    href: '/#pricing',
  },
  {
    id: 'course-3',
    title: 'AI Workshop',
    instructor: instructor.name,
    badges: ['2.5 Hours', 'Live Session'],
    price: '$29',
    image: '/course3.jpeg',
    href: '/#pricing',
  },
] as const;
