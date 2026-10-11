import type { Metadata } from 'next';
import { ReserveClient } from './ReserveClient';

export const metadata: Metadata = {
  title: 'Reserve your seat - AhmiXen',
  robots: { index: false, follow: false },
};

export default function ReservePage() {
  return <ReserveClient />;
}
