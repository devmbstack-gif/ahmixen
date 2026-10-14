import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

export const EMAIL_JOB_TYPES = ['reservation_confirmed'] as const;
export type EmailJobType = (typeof EMAIL_JOB_TYPES)[number];

export const EMAIL_JOB_STATUSES = [
  'pending',
  'sent',
  'failed',
  'skipped',
] as const;
export type EmailJobStatus = (typeof EMAIL_JOB_STATUSES)[number];

const EmailJobSchema = new Schema(
  {
    orderId: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: EMAIL_JOB_TYPES,
      required: true,
    },
    to: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: EMAIL_JOB_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    sentCount: { type: Number, default: 0, min: 0 },
    lastError: { type: String, default: '', trim: true, maxlength: 200 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    sentAt: { type: Date, default: null },
    /** Timestamps of successful sends (trimmed to last 24h on write). */
    sendLog: { type: [{ type: Date }], default: [] },
    /** Optional note such as "logged" for log mode */
    lastNote: { type: String, default: '', trim: true, maxlength: 80 },
  },
  {
    timestamps: true,
    collection: 'emailJobs',
  }
);

EmailJobSchema.index({ orderId: 1, type: 1 }, { unique: true });
EmailJobSchema.index({ status: 1, nextAttemptAt: 1, attempts: 1 });
EmailJobSchema.index({ sentAt: -1 });

export type EmailJobDocument = InferSchemaType<typeof EmailJobSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const EmailJob: Model<EmailJobDocument> =
  (mongoose.models.EmailJob as Model<EmailJobDocument>) ||
  mongoose.model<EmailJobDocument>('EmailJob', EmailJobSchema);
