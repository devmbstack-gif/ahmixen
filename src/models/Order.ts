import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    emailNormalized: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    profession: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const PlanSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['one_time', 'installment'], required: true },
    currency: { type: String, enum: ['PKR', 'USD'], required: true },
    price: { type: Number, required: true, min: 0 },
    installmentsCount: { type: Number, default: null },
  },
  { _id: false }
);

const CouponSnapshotSchema = new Schema(
  {
    couponId: { type: String, required: true },
    code: { type: String, required: true },
    discountAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const AmountsSchema = new Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    installmentsCount: { type: Number, required: true, min: 1, default: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const UtmSchema = new Schema(
  {
    source: { type: String, default: '', trim: true, maxlength: 100 },
    medium: { type: String, default: '', trim: true, maxlength: 100 },
    campaign: { type: String, default: '', trim: true, maxlength: 100 },
    content: { type: String, default: '', trim: true, maxlength: 100 },
    term: { type: String, default: '', trim: true, maxlength: 100 },
  },
  { _id: false }
);

const ProofSchema = new Schema(
  {
    fileId: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    uploadedAt: { type: Date, required: true },
    uploadCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'created',
        'proof_uploaded',
        'approved',
        'rejected',
        'expired',
        'cancelled',
        'note',
      ],
      required: true,
    },
    at: { type: Date, required: true, default: Date.now },
    adminId: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, trim: true },
    publicToken: { type: String, required: true, trim: true },
    sessionId: { type: String, required: true, trim: true, index: true },
    planId: { type: String, required: true, trim: true },
    customer: { type: CustomerSchema, required: true },
    planSnapshot: { type: PlanSnapshotSchema, required: true },
    coupon: { type: CouponSnapshotSchema, default: null },
    amounts: { type: AmountsSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer'],
      required: true,
      default: 'bank_transfer',
    },
    proof: { type: ProofSchema, default: null },
    status: {
      type: String,
      enum: [
        'awaiting_payment',
        'pending_verification',
        'approved',
        'rejected',
        'expired',
        'cancelled',
      ],
      required: true,
      default: 'awaiting_payment',
      index: true,
    },
    isLive: { type: Boolean, required: true, default: true },
    rejectionReason: { type: String, default: '' },
    adminNote: { type: String, default: '', maxlength: 500 },
    events: { type: [EventSchema], default: [] },
    utm: { type: UtmSchema, default: () => ({}) },
    leadId: { type: String, default: '', trim: true },
    isTestData: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ publicToken: 1 }, { unique: true });
OrderSchema.index(
  { sessionId: 1, 'customer.emailNormalized': 1 },
  {
    unique: true,
    partialFilterExpression: { isLive: true },
    name: 'live_order_per_email_per_session',
  }
);
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ sessionId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ isTestData: 1 });

export type OrderStatus =
  | 'awaiting_payment'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type OrderDocument = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const Order: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) ||
  mongoose.model<OrderDocument>('Order', OrderSchema);
