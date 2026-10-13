import { TestimonialForm } from '@/components/admin/testimonials/TestimonialForm';

export const metadata = { title: 'New testimonial' };

export default function Page() {
  return <TestimonialForm mode="create" />;
}
