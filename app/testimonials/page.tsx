import type { Metadata } from 'next';
import { TestimonialsPage } from '@/components/TestimonialsPage';

export const metadata: Metadata = {
  title: 'Testimonials - AhmiXen',
};

export default function Page() {
  return <TestimonialsPage />;
}
