import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 20,
    },
    note: { type: String, default: '', trim: true, maxlength: 120 },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 1 },
    currency: {
      type: String,
      enum: ['PKR', 'USD', ''],
      default: '',
    },
    planId: { type: String, default: '', trim: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    perEmailLimit: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      required: true,
      default: 'active',
    },
    isPopupCoupon: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'coupons',
  }
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index(
  { isPopupCoupon: 1 },
  {
    unique: true,
    partialFilterExpression: { isPopupCoupon: true },
  }
);
CouponSchema.index({ status: 1, createdAt: -1 });

export type CouponDocument = InferSchemaType<typeof CouponSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const Coupon: Model<CouponDocument> =
  (mongoose.models.Coupon as Model<CouponDocument>) ||
  mongoose.model<CouponDocument>('Coupon', CouponSchema);
