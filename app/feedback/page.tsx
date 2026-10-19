import type { Metadata } from 'next';
import { FeedbackForm } from '@/components/FeedbackForm';

export const metadata: Metadata = {
  title: 'Give us a review - AhmiXen',
  description:
    'Leave a review of your AhmiXen experience. Approved reviews appear on our testimonials page.',
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return <FeedbackForm />;
}
