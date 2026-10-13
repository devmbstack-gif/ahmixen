import type { Metadata } from 'next';
import { ProgramsPage } from '@/components/ProgramsPage';
import { getPublicSession } from '@/lib/sessions/public';
import { getProgramsContent, getSeoContent } from '@/lib/content/landingPublic';

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  return {
    title: seo.programs.title,
    description: seo.programs.description,
  };
}

export default async function Page() {
  const [publicSession, programs] = await Promise.all([
    getPublicSession(),
    getProgramsContent(),
  ]);
  return (
    <ProgramsPage publicSession={publicSession} cards={programs.cards} />
  );
}
