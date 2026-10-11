import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
      required: true,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: 'admins',
  }
);

export type AdminDocument = InferSchemaType<typeof AdminSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Admin: Model<AdminDocument> =
  (mongoose.models.Admin as Model<AdminDocument>) ||
  mongoose.model<AdminDocument>('Admin', AdminSchema);
