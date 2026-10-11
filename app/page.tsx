import { HomePage } from '@/components/HomePage';
import { getPublicSession } from '@/lib/sessions/public';

export const revalidate = 30;

export default async function Page() {
  const publicSession = await getPublicSession();
  return <HomePage publicSession={publicSession} />;
}
