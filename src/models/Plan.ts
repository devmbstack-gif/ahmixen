import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const PlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['one_time', 'installment'],
      required: true,
      default: 'one_time',
    },
    currency: {
      type: String,
      enum: ['PKR', 'USD'],
      required: true,
      default: 'PKR',
    },
    price: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number, default: null },
    installmentsCount: { type: Number, default: null },
    features: { type: [String], default: [] },
    sessionId: { type: String, default: '', trim: true },
    validUntil: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'hidden', 'archived'],
      required: true,
      default: 'hidden',
    },
    sortOrder: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'plans',
  }
);

PlanSchema.index({ status: 1, sortOrder: 1 });
PlanSchema.index({ name: 'text' });

export type PlanDocument = InferSchemaType<typeof PlanSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const Plan: Model<PlanDocument> =
  (mongoose.models.Plan as Model<PlanDocument>) ||
  mongoose.model<PlanDocument>('Plan', PlanSchema);
