import type { Metadata } from 'next';
import { TermsOfServicePage } from '@/components/TermsOfServicePage';

export const metadata: Metadata = {
  title: 'Terms of Service - AhmiXen',
  description:
    'Terms of Service for AmiXen Institute of Artificial Intelligence.',
};

export default function Page() {
  return <TermsOfServicePage />;
}
