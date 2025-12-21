/**
 * Feed generation and article tracking
 * Handles Atom feed creation and change detection
 */

import { Feed } from 'feed';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CONFIG, type Article, type TrackingData } from './config.js';

// ============================================================================
// TRACKING
// ============================================================================

export async function loadTracking(): Promise<TrackingData> {
  try {
    const content = await readFile(CONFIG.TRACKING_FILE, 'utf-8');
    const data = JSON.parse(content) as TrackingData;
    console.log(`Loaded tracking data: ${Object.keys(data).length} entries`);
    return data;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('No tracking file found, starting fresh');
      return {};
    }
    throw error;
  }
}

export async function saveTracking(tracking: TrackingData): Promise<void> {
  await mkdir(dirname(CONFIG.TRACKING_FILE), { recursive: true });
  await writeFile(CONFIG.TRACKING_FILE, JSON.stringify(tracking, null, 2), 'utf-8');
  console.log(`Saved tracking data: ${Object.keys(tracking).length} entries`);
}

export function detectChanges(articles: Article[], tracking: TrackingData) {
  const newArticles: Article[] = [];
  const updated: Article[] = [];
  let unchanged = 0;
  const now = new Date().toISOString();
  const updatedTracking: TrackingData = { ...tracking };

  for (const article of articles) {
    const existing = tracking[article.id];

    if (!existing) {
      // New article
      newArticles.push(article);
      updatedTracking[article.id] = {
        contentHash: article.id,
        lastSeen: now,
        link: article.link,
      };
    } else if (existing.link !== article.link) {
      // Article updated (link changed)
      updated.push(article);
      updatedTracking[article.id] = {
        contentHash: article.id,
        lastSeen: now,
        link: article.link,
      };
    } else {
      // Unchanged - just update lastSeen
      unchanged++;
      updatedTracking[article.id] = {
        ...existing,
        lastSeen: now,
      };
    }
  }

  console.log(
    `Changes: ${newArticles.length} new, ${updated.length} updated, ${unchanged} unchanged`
  );

  return { newArticles, updated, unchanged, updatedTracking };
}

// ============================================================================
// FEED GENERATION
// ============================================================================

export async function generateFeed(articles: Article[]): Promise<void> {
  const feed = new Feed({
    title: CONFIG.FEED.title,
    description: CONFIG.FEED.description,
    id: CONFIG.SOURCE_URL,
    link: CONFIG.SOURCE_URL,
    language: CONFIG.FEED.language,
    updated: new Date(),
    feedLinks: {
      atom: CONFIG.FEED.url,
    },
    copyright: `Stadt Karlsruhe ${new Date().getFullYear()}`,
  });

  // Limit articles to MAX_ARTICLES
  const limited = articles.slice(0, CONFIG.MAX_ARTICLES);
  console.log(`Adding ${limited.length} articles to feed (max: ${CONFIG.MAX_ARTICLES})`);

  for (const article of limited) {
    feed.addItem({
      id: article.id,
      title: article.title,
      link: article.link,
      description: article.description,
      content: article.content,
      date: article.date,
      published: article.date,
    });
  }

  // Write feed to file
  await mkdir(dirname(CONFIG.OUTPUT_FILE), { recursive: true });
  await writeFile(CONFIG.OUTPUT_FILE, feed.atom1(), 'utf-8');

  console.log(`✓ Generated feed: ${CONFIG.OUTPUT_FILE}`);
}
