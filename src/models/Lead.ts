import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

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

const LeadProofSchema = new Schema(
  {
    fileId: { type: String, default: '' },
    contentType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    emailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: { type: String, required: true, trim: true },
    profession: { type: String, default: '', trim: true },
    message: { type: String, default: '', trim: true, maxlength: 500 },
    city: { type: String, default: '', trim: true, maxlength: 80 },
    skillLevel: {
      type: String,
      enum: ['', 'beginner', 'intermediate', 'advanced'],
      default: '',
    },
    learningGoals: { type: [String], default: [] },
    paidConfirmed: { type: Boolean, default: false },
    programId: { type: String, default: '', trim: true, maxlength: 80 },
    programTitle: { type: String, default: '', trim: true, maxlength: 120 },
    kind: {
      type: String,
      enum: ['general', 'workshop'],
      default: 'general',
    },
    proof: { type: LeadProofSchema, default: () => ({}) },
    utm: { type: UtmSchema, default: () => ({}) },
    referrer: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted'],
      default: 'new',
      required: true,
    },
    convertedOrderId: { type: String, default: '' },
    submissionsCount: { type: Number, default: 1, min: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    adminNote: { type: String, default: '', trim: true, maxlength: 500 },
    version: { type: Number, default: 1, min: 1 },
  },
  {
    timestamps: true,
    collection: 'leads',
  }
);

LeadSchema.index({ status: 1, lastSeenAt: -1 });
LeadSchema.index({ kind: 1, lastSeenAt: -1 });

export type LeadDocument = InferSchemaType<typeof LeadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const Lead: Model<LeadDocument> =
  (mongoose.models.Lead as Model<LeadDocument>) ||
  mongoose.model<LeadDocument>('Lead', LeadSchema);
