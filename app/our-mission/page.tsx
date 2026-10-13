import type { Metadata } from 'next';
import { MissionPage } from '@/components/MissionPage';
import { getInstructor, getMission } from '@/lib/content/public';
import { getSeoContent } from '@/lib/content/landingPublic';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  return {
    title: seo['our-mission'].title,
    description: seo['our-mission'].description,
  };
}

export default async function Page() {
  const [mission, instructor] = await Promise.all([
    getMission(),
    getInstructor(),
  ]);
  return <MissionPage mission={mission} instructor={instructor} />;
}
