import { CouponForm } from '@/components/admin/coupons/CouponForm';
import { connectToDatabase } from '@/lib/db';
import { Plan } from '@/models/Plan';
import { Coupon } from '@/models/Coupon';
import { requireAdmin } from '@/lib/auth/admin-session';

export const metadata = { title: 'New coupon' };

export default async function Page() {
  await requireAdmin();
  await connectToDatabase();

  const [plans, popup] = await Promise.all([
    Plan.find({ status: { $ne: 'archived' } })
      .sort({ sortOrder: 1, name: 1 })
      .select({
        name: 1,
        type: 1,
        currency: 1,
        price: 1,
        installmentsCount: 1,
        status: 1,
      })
      .lean(),
    Coupon.findOne({ isPopupCoupon: true }).select({ code: 1 }).lean(),
  ]);

  return (
    <CouponForm
      mode="create"
      currentPopupCode={popup?.code ?? null}
      plans={plans.map((p) => ({
        id: String(p._id),
        name: p.name,
        type: p.type as 'one_time' | 'installment',
        currency: p.currency as 'PKR' | 'USD',
        price: p.price,
        installmentsCount: p.installmentsCount ?? null,
        status: p.status,
      }))}
    />
  );
}
