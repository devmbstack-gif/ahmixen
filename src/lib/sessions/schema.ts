import { z } from 'zod';

export const sessionWriteSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().default(''),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  localTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(600),
  timezone: z.string().trim().min(1).max(64).optional().default('Asia/Karachi'),
  status: z.enum(['draft', 'open', 'closed', 'completed', 'archived']).optional(),
  seatsTotal: z.number().int().min(1).max(100000),
  holdHours: z.number().int().min(1).max(72).optional().default(24),
  showLimitedSeatsBadge: z.boolean().optional().default(true),
  meetingLink: z.string().trim().max(2000).optional().default(''),
  recordingUrl: z.string().trim().max(2000).optional().default(''),
});

export const sessionPatchSchema = sessionWriteSchema.partial().extend({
  version: z.number().int().min(1),
  status: z.enum(['draft', 'open', 'closed', 'completed', 'archived']).optional(),
});
