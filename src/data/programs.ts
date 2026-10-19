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

/** Course catalog — Workshop, Mentorship, Accelerator */
export const PROGRAMS: readonly ProgramCard[] = [
  {
    id: 'workshop',
    title: 'Workshop',
    instructor: 'Ahmi',
    badges: ['Live Session'],
    price: 'PKR 999',
    image: '/course4.jpeg',
    href: '/#pricing',
    status: 'open',
  },
  {
    id: 'mentorship-1-month',
    title: 'one month Mentorship',
    instructor: 'Ahmi',
    badges: ['1 Month', 'Mentorship'],
    price: 'PKR 8,999',
    image: '/course1.jpeg',
    href: '/#pricing',
    status: 'open',
  },
  {
    id: 'ai-generalist-accelerator',
    title: 'AI Generalist Accelerator Program',
    instructor: 'Ahmi',
    badges: ['Accelerator'],
    price: 'PKR 29,999',
    image: '/course2.jpeg',
    href: '/#pricing',
    status: 'open',
  },
] as const;
