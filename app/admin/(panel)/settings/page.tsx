import { PaymentSettingsClient } from '@/components/admin/settings/PaymentSettingsClient';
import { connectToDatabase } from '@/lib/db';
import { Setting } from '@/models/Setting';
import { requireAdmin } from '@/lib/auth/admin-session';
import { serializePaymentSettings } from '@/lib/settings/serialize';

export const metadata = { title: 'Settings' };

export default async function Page() {
  await requireAdmin();
  await connectToDatabase();
  const doc = await Setting.findOne({ key: 'payment' });
  return <PaymentSettingsClient initial={serializePaymentSettings(doc)} />;
}
