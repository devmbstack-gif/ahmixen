import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * One row per coupon use on an order.
 * usedCount counts only documents where isActive !== false
 * (active while the order isLive is true).
 */
const CouponRedemptionSchema = new Schema(
  {
    couponId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    orderId: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    /** Default true for new docs; legacy docs without the field count as active. */
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'couponRedemptions',
  }
);

CouponRedemptionSchema.index({ couponId: 1, createdAt: -1 });
CouponRedemptionSchema.index({ couponId: 1, email: 1 });
CouponRedemptionSchema.index({ orderId: 1 });
CouponRedemptionSchema.index({ isActive: 1 });

export type CouponRedemptionDocument = InferSchemaType<
  typeof CouponRedemptionSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
};

export const CouponRedemption: Model<CouponRedemptionDocument> =
  (mongoose.models.CouponRedemption as Model<CouponRedemptionDocument>) ||
  mongoose.model<CouponRedemptionDocument>(
    'CouponRedemption',
    CouponRedemptionSchema
  );
