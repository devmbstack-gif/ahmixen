import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminSpotlightSession } from '@/lib/sessions/dashboard';

export const metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboardPage() {
  let spotlight = null;
  try {
    spotlight = await getAdminSpotlightSession();
  } catch (err) {
    console.error('[dashboard]', err instanceof Error ? err.message : 'error');
  }

  return <AdminDashboard spotlight={spotlight} />;
}
