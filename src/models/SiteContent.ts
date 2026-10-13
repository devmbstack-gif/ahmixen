import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const SiteContentSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true },
    version: { type: Number, default: 1 },
    updatedBy: { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'siteContent',
  }
);

export type SiteContentDocument = InferSchemaType<typeof SiteContentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SiteContent: Model<SiteContentDocument> =
  mongoose.models.SiteContent ||
  mongoose.model<SiteContentDocument>('SiteContent', SiteContentSchema);
