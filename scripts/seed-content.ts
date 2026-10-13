/**
 * Idempotent content seed (no dummy people / placeholder reviews):
 * - testimonials from src/data/reviews.ts only when that array has entries
 *   and the collection is empty (REVIEWS is empty for production)
 * - siteContent instructor + mission + landing keys (only if missing)
 * - static mediaAssets for public images (no file copy)
 *
 * Usage: npm run seed:content
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { assertScriptAllowed } from './dev-guard';
import { REVIEWS } from '../src/data/reviews';
import { instructor } from '../src/data/instructor';
import { MISSION } from '../src/data/mission';
import {
  CONTENT_REGISTRY,
  LANDING_CONTENT_KEYS,
} from '../src/lib/content/registry';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertScriptAllowed(uri, 'seed:content');

  await mongoose.connect(uri);

  // Lazy import models after env is loaded
  const { MediaAsset } = await import('../src/models/MediaAsset');
  const { Testimonial } = await import('../src/models/Testimonial');
  const { SiteContent } = await import('../src/models/SiteContent');

  const summary = {
    mediaCreated: 0,
    mediaSkipped: 0,
    testimonialsCreated: 0,
    testimonialsSkipped: false,
    instructorCreated: false,
    missionCreated: false,
    landingCreated: [] as string[],
    landingSkipped: [] as string[],
  };

  const staticImages: Array<{
    path: string;
    name: string;
    altText: string;
    contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  }> = [
    {
      path: instructor.photo,
      name: 'Instructor photo',
      altText: instructor.name,
      contentType: 'image/jpeg',
    },
  ];

  let instructorPhotoAssetId: string | null = null;

  for (const img of staticImages) {
    const staticPath = img.path.startsWith('/') ? img.path : `/${img.path}`;
    const existing = await MediaAsset.findOne({
      kind: 'static',
      staticPath,
    });
    if (existing) {
      summary.mediaSkipped += 1;
      if (staticPath === instructor.photo || staticPath === `/${instructor.photo.replace(/^\//, '')}`) {
        instructorPhotoAssetId = String(existing._id);
      }
      continue;
    }
    const created = await MediaAsset.create({
      kind: 'static',
      fileId: null,
      staticPath,
      name: img.name,
      altText: img.altText,
      contentType: img.contentType,
      size: 0,
      width: null,
      height: null,
      uploadedBy: 'seed',
      version: 1,
    });
    summary.mediaCreated += 1;
    instructorPhotoAssetId = String(created._id);
  }

  const testimonialCount = await Testimonial.countDocuments();
  if (testimonialCount > 0) {
    summary.testimonialsSkipped = true;
  } else {
    const approved = REVIEWS.filter((r) => r.status === 'approved');
    const featured = approved.filter((r) => r.featured);
    const rest = approved.filter((r) => !r.featured);
    const ordered = [...featured, ...rest];
    let order = 0;
    for (const r of ordered) {
      await Testimonial.create({
        name: r.name,
        role: r.role,
        quote: r.text,
        rating: r.rating,
        avatarAssetId: null,
        visible: true,
        sortOrder: order++,
        version: 1,
        createdBy: 'seed',
        updatedBy: 'seed',
      });
      summary.testimonialsCreated += 1;
    }
  }

  const instructorDoc = await SiteContent.findOne({ key: 'instructor' });
  if (!instructorDoc) {
    await SiteContent.create({
      key: 'instructor',
      data: {
        ...instructor,
        photoAssetId: instructorPhotoAssetId,
      },
      version: 1,
      updatedBy: 'seed',
      updatedByName: 'seed',
    });
    summary.instructorCreated = true;
  }

  const missionDoc = await SiteContent.findOne({ key: 'mission' });
  if (!missionDoc) {
    await SiteContent.create({
      key: 'mission',
      data: structuredClone(MISSION),
      version: 1,
      updatedBy: 'seed',
      updatedByName: 'seed',
    });
    summary.missionCreated = true;
  }

  for (const key of LANDING_CONTENT_KEYS) {
    const existing = await SiteContent.findOne({ key });
    if (existing) {
      summary.landingSkipped.push(key);
      continue;
    }
    await SiteContent.create({
      key,
      data: structuredClone(CONTENT_REGISTRY[key].staticDefault),
      version: 1,
      updatedBy: 'seed',
      updatedByName: 'seed',
    });
    summary.landingCreated.push(key);
  }

  console.log('seed:content summary');
  console.log(`  mediaAssets created: ${summary.mediaCreated} (skipped existing: ${summary.mediaSkipped})`);
  console.log(
    summary.testimonialsSkipped
      ? '  testimonials: skipped (collection not empty)'
      : `  testimonials created: ${summary.testimonialsCreated}`
  );
  console.log(
    summary.instructorCreated
      ? '  siteContent.instructor: created'
      : '  siteContent.instructor: skipped (already exists)'
  );
  console.log(
    summary.missionCreated
      ? '  siteContent.mission: created'
      : '  siteContent.mission: skipped (already exists)'
  );
  console.log(
    summary.landingCreated.length
      ? `  landing keys created: ${summary.landingCreated.join(', ')}`
      : '  landing keys: none created'
  );
  console.log(
    summary.landingSkipped.length
      ? `  landing keys skipped: ${summary.landingSkipped.join(', ')}`
      : '  landing keys skipped: none'
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
