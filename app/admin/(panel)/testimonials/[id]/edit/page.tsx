import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/auth/admin-session';
import { connectToDatabase } from '@/lib/db';
import { Testimonial } from '@/models/Testimonial';
import { MediaAsset } from '@/models/MediaAsset';
import { serializeTestimonial } from '@/lib/testimonials/serialize';
import { TestimonialForm } from '@/components/admin/testimonials/TestimonialForm';

export const metadata = { title: 'Edit testimonial' };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectToDatabase();
  const doc = await Testimonial.findById(id);
  if (!doc) notFound();
  const avatar = doc.avatarAssetId
    ? await MediaAsset.findById(doc.avatarAssetId).lean()
    : null;

  return (
    <TestimonialForm mode="edit" initial={serializeTestimonial(doc, avatar)} />
  );
}
