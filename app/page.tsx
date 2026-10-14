import type { Metadata } from 'next';
import { HomePage } from '@/components/HomePage';
import { getPublicSession } from '@/lib/sessions/public';
import {
  getInstructor,
  getLandingTestimonials,
} from '@/lib/content/public';
import {
  getAgendaContent,
  getAiJobsContent,
  getHeroContent,
  getIntroContent,
  getPreviewContent,
  getPricingContent,
  getProgramsContent,
  getSeoContent,
} from '@/lib/content/landingPublic';

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  return {
    title: seo.home.title,
    description: seo.home.description,
  };
}

export default async function Page() {
  const publicSession = await getPublicSession();
  const [
    instructor,
    reviews,
    intro,
    hero,
    preview,
    aiJobs,
    agenda,
    pricing,
    programs,
  ] = await Promise.all([
    getInstructor(),
    getLandingTestimonials(),
    getIntroContent(),
    getHeroContent(publicSession.durationMinutes),
    getPreviewContent(),
    getAiJobsContent(),
    getAgendaContent(),
    getPricingContent(),
    getProgramsContent(),
  ]);

  return (
    <HomePage
      publicSession={publicSession}
      instructor={instructor}
      reviews={reviews}
      landing={{
        intro,
        hero,
        preview,
        aiJobs,
        agenda,
        pricing,
        programs: programs.cards,
      }}
    />
  );
}
