import type { Metadata } from 'next';
import { ProgramsPage } from '@/components/ProgramsPage';
import { getPublicSession } from '@/lib/sessions/public';

export const metadata: Metadata = {
  title: 'Programs - AhmiXen',
};

export const revalidate = 30;

export default async function Page() {
  const publicSession = await getPublicSession();
  return <ProgramsPage publicSession={publicSession} />;
}
