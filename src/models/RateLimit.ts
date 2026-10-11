import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const RateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    windowStart: { type: Date, required: true },
    expireAt: { type: Date, required: true },
  },
  {
    collection: 'rateLimits',
  }
);

RateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDocument = InferSchemaType<typeof RateLimitSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RateLimit: Model<RateLimitDocument> =
  (mongoose.models.RateLimit as Model<RateLimitDocument>) ||
  mongoose.model<RateLimitDocument>('RateLimit', RateLimitSchema);
