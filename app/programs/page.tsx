import type { Metadata } from 'next';
import { ProgramsPage } from '@/components/ProgramsPage';

export const metadata: Metadata = {
  title: 'Programs - AhmiXen',
};

export default function Page() {
  return <ProgramsPage />;
}
