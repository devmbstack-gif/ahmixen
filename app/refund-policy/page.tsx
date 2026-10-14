import type { Metadata } from 'next';
import { RefundPolicyPage } from '@/components/RefundPolicyPage';

export const metadata: Metadata = {
  title: 'Refund Policy - AhmiXen',
  description:
    'Refund policy for AmiXen Institute of Artificial Intelligence purchases.',
};

export default function Page() {
  return <RefundPolicyPage />;
}
