import type { Metadata } from 'next';
import { MissionPage } from '@/components/MissionPage';

export const metadata: Metadata = {
  title: 'Our Mission - AhmiXen',
};

export default function Page() {
  return <MissionPage />;
}
