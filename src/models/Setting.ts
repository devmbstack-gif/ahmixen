import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    bankTransferEnabled: { type: Boolean, default: false },
    bankName: { type: String, default: '', trim: true },
    accountTitle: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    iban: { type: String, default: '', trim: true },
    paymentInstructions: { type: String, default: '', trim: true },
    cardPaymentEnabled: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    updatedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

export type SettingDocument = InferSchemaType<typeof SettingSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const Setting: Model<SettingDocument> =
  (mongoose.models.Setting as Model<SettingDocument>) ||
  mongoose.model<SettingDocument>('Setting', SettingSchema);
