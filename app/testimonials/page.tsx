import type { Metadata } from 'next';
import { TestimonialsPage } from '@/components/TestimonialsPage';
import { getInstructor, getTestimonials } from '@/lib/content/public';
import { getSeoContent } from '@/lib/content/landingPublic';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoContent();
  return {
    title: seo.testimonials.title,
    description: seo.testimonials.description,
  };
}

export default async function Page() {
  const [reviews, instructor] = await Promise.all([
    getTestimonials(),
    getInstructor(),
  ]);
  return <TestimonialsPage reviews={reviews} instructor={instructor} />;
}
