import { z } from 'zod';

export const articleSchema = z.object({
  id: z.string().min(1), // Now MD5 hash of content
  title: z.string().min(1),
  date: z.date(),
  link: z.string().url(),
  description: z.string(),
  content: z.string(), // Full content from detail page
});

export const trackingEntrySchema = z.object({
  contentHash: z.string().length(32), // MD5 hash of content (same as ID)
  lastSeen: z.string().datetime(),
  link: z.string().url(), // Store link to track article URL changes
});

export const trackingDataSchema = z.record(z.string(), trackingEntrySchema);

export type Article = z.infer<typeof articleSchema>;
export type TrackingEntry = z.infer<typeof trackingEntrySchema>;
export type TrackingData = z.infer<typeof trackingDataSchema>;
export type ArticlePreview = Omit<Article, 'id' | 'content'>;
