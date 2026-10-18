import type { Metadata } from 'next';
import { FeedbackForm } from '@/components/FeedbackForm';

export const metadata: Metadata = {
  title: 'Share your feedback - AhmiXen',
  description:
    'Leave a review of your AhmiXen workshop experience. Approved feedback appears on our testimonials page.',
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return <FeedbackForm />;
}
