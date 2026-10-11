import { SessionForm } from '@/components/admin/sessions/SessionForm';

export const metadata = { title: 'New session' };

export default function NewSessionPage() {
  return <SessionForm mode="create" />;
}
