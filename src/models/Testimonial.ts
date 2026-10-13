import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, default: '', trim: true, maxlength: 80 },
    quote: { type: String, required: true, trim: true, maxlength: 400 },
    rating: { type: Number, default: null, min: 1, max: 5 },
    avatarAssetId: { type: String, default: null },
    visible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'testimonials',
  }
);

TestimonialSchema.index({ sortOrder: 1, createdAt: 1 });
TestimonialSchema.index({ visible: 1, sortOrder: 1 });
TestimonialSchema.index({ avatarAssetId: 1 });

export type TestimonialDocument = InferSchemaType<typeof TestimonialSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Testimonial: Model<TestimonialDocument> =
  mongoose.models.Testimonial ||
  mongoose.model<TestimonialDocument>('Testimonial', TestimonialSchema);
