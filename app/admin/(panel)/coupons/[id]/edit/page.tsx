import { notFound } from 'next/navigation';
import { CouponForm } from '@/components/admin/coupons/CouponForm';
import { connectToDatabase } from '@/lib/db';
import { Plan } from '@/models/Plan';
import { Coupon } from '@/models/Coupon';
import { requireAdmin } from '@/lib/auth/admin-session';
import { serializeAdminCoupon } from '@/lib/coupons/serialize';
import { countRedemptionsForCoupon } from '@/lib/coupons/redemptions';

export const metadata = { title: 'Edit coupon' };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  await requireAdmin();
  await connectToDatabase();
  const { id } = await params;
  const doc = await Coupon.findById(id);
  if (!doc) notFound();

  const [plans, usedCount, popup, plan] = await Promise.all([
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
    countRedemptionsForCoupon(id),
    Coupon.findOne({ isPopupCoupon: true }).select({ code: 1 }).lean(),
    doc.planId
      ? Plan.findById(doc.planId).select({ name: 1 }).lean()
      : Promise.resolve(null),
  ]);

  return (
    <CouponForm
      mode="edit"
      initial={serializeAdminCoupon(doc, usedCount, plan?.name ?? null)}
      usedCount={usedCount}
      codeLocked={usedCount > 0}
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
