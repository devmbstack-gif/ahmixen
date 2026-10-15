import { PaymentSettingsClient } from '@/components/admin/settings/PaymentSettingsClient';
import { EmailSettingsClient } from '@/components/admin/settings/EmailSettingsClient';
import { AccountSettingsClient } from '@/components/admin/settings/AccountSettingsClient';
import { connectToDatabase } from '@/lib/db';
import { Setting } from '@/models/Setting';
import { requireAdmin } from '@/lib/auth/admin-session';
import { serializePaymentSettings } from '@/lib/settings/serialize';

export const metadata = { title: 'Settings' };

export default async function Page() {
  const admin = await requireAdmin();
  await connectToDatabase();
  const doc = await Setting.findOne({ key: 'payment' });
  return (
    <div className="w-full max-w-3xl space-y-6">
      <AccountSettingsClient currentEmail={admin.email} />
      <PaymentSettingsClient initial={serializePaymentSettings(doc)} />
      <EmailSettingsClient adminEmail={admin.email} />
    </div>
  );
}
