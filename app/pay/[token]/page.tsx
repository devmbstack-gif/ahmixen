import type { Metadata } from 'next';
import { PayClient } from './PayClient';

export const metadata: Metadata = {
  title: 'Complete your payment - AhmiXen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type Props = { params: Promise<{ token: string }> };

export default async function PayPage({ params }: Props) {
  const { token } = await params;
  return <PayClient token={token} />;
}
