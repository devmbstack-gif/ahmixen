import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Short-lived OTP challenges for admin forgot-password.
 * Documents expire via TTL on expiresAt.
 */
const AdminPasswordResetSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: 'admin_password_resets',
  }
);

AdminPasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AdminPasswordResetDocument = InferSchemaType<
  typeof AdminPasswordResetSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminPasswordReset: Model<AdminPasswordResetDocument> =
  (mongoose.models.AdminPasswordReset as Model<AdminPasswordResetDocument>) ||
  mongoose.model<AdminPasswordResetDocument>(
    'AdminPasswordReset',
    AdminPasswordResetSchema
  );
