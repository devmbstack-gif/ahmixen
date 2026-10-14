export type ProgramStatus = 'open' | 'locked';

export type ProgramCard = {
  id: string;
  title: string;
  instructor: string;
  badges: readonly string[];
  /** Display price, e.g. "Rs 500". Empty for locked cards until they open. */
  price: string;
  image: string;
  href: string;
  status: ProgramStatus;
};

/** Course catalog — one open workshop + two locked upcoming */
export const PROGRAMS: readonly ProgramCard[] = [
  {
    id: 'ai-automation-live',
    title: 'AI Automation Live Workshop',
    instructor: 'Ahmi',
    badges: ['2.5 Hours', 'Live Session'],
    price: 'Rs 500',
    image: '/course4.jpeg',
    href: '/#programs',
    status: 'open',
  },
  {
    id: 'course-1',
    title: 'AI Workshop',
    instructor: 'Ahmi',
    badges: ['2.5 Hours', 'Live Session'],
    price: '',
    image: '/course1.jpeg',
    href: '/programs',
    status: 'locked',
  },
  {
    id: 'course-2',
    title: 'AI Workshop',
    instructor: 'Ahmi',
    badges: ['2.5 Hours', 'Live Session'],
    price: '',
    image: '/course2.jpeg',
    href: '/programs',
    status: 'locked',
  },
] as const;
