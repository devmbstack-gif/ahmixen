import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const MediaAssetSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ['upload', 'static'],
      required: true,
    },
    fileId: { type: String, default: null },
    staticPath: { type: String, default: null },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    altText: { type: String, default: '', trim: true, maxlength: 160 },
    contentType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
      required: true,
    },
    size: { type: Number, required: true, min: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    uploadedBy: { type: String, default: '' },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: 'mediaAssets',
  }
);

MediaAssetSchema.index({ name: 'text' });
MediaAssetSchema.index({ createdAt: -1 });
MediaAssetSchema.index({ kind: 1, staticPath: 1 });

export type MediaAssetDocument = InferSchemaType<typeof MediaAssetSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MediaAsset: Model<MediaAssetDocument> =
  mongoose.models.MediaAsset ||
  mongoose.model<MediaAssetDocument>('MediaAsset', MediaAssetSchema);
