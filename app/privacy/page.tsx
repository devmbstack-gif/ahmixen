import type { Metadata } from 'next';
import { PrivacyPolicyPage } from '@/components/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy - AhmiXen',
  description:
    'How AhmiXen collects, uses, and protects your information for workshops and mentorship.',
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
