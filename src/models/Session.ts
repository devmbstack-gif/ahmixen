import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const HoldSchema = new Schema(
  {
    orderId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    startsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 600 },
    timezone: { type: String, default: 'Asia/Karachi' },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'completed', 'archived'],
      default: 'draft',
      required: true,
    },
    seatsTotal: { type: Number, required: true, min: 0 },
    seatsConfirmed: { type: Number, default: 0, min: 0 },
    holds: { type: [HoldSchema], default: [] },
    holdHours: { type: Number, default: 24, min: 1, max: 168 },
    showLimitedSeatsBadge: { type: Boolean, default: true },
    meetingLink: { type: String, default: '' },
    recordingUrl: { type: String, default: '' },
    isLandingActive: { type: Boolean, default: false, index: true },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

SessionSchema.index({ status: 1, startsAt: 1 });
SessionSchema.index({ title: 'text' });

export type SessionDocument = InferSchemaType<typeof SessionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const Session: Model<SessionDocument> =
  (mongoose.models.Session as Model<SessionDocument>) ||
  mongoose.model<SessionDocument>('Session', SessionSchema);
