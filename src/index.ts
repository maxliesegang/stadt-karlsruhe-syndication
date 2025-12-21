#!/usr/bin/env node
/**
 * Stadt Karlsruhe News Feed Generator
 *
 * Main entry point - orchestrates the feed generation pipeline:
 * 1. Fetch news listing page
 * 2. Scrape and parse articles
 * 3. Track changes
 * 4. Generate Atom feed
 */

import { CONFIG } from './config.js';
import { fetchHtml, scrapeArticles } from './scraper.js';
import { loadTracking, detectChanges, saveTracking, generateFeed } from './feed.js';

async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('='.repeat(60));
    console.log('Stadt Karlsruhe Feed Generator');
    console.log('='.repeat(60));
    console.log();

    // 1. Fetch listing page
    const listingHtml = await fetchHtml(CONFIG.SOURCE_URL);
    console.log();

    // 2. Scrape articles (includes fetching detail pages)
    const articles = await scrapeArticles(listingHtml);

    if (articles.length === 0) {
      console.warn('No articles found!');
      process.exit(0);
    }

    // 3. Load tracking and detect changes
    const tracking = await loadTracking();
    const { updatedTracking } = detectChanges(articles, tracking);
    console.log();

    // 4. Generate feed
    await generateFeed(articles);
    console.log();

    // 5. Save tracking
    await saveTracking(updatedTracking);

    // Done!
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log();
    console.log('='.repeat(60));
    console.log(`✓ Feed generation complete (${duration}s)`);
    console.log('='.repeat(60));
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error();
    console.error('='.repeat(60));
    console.error(`✗ Feed generation failed after ${duration}s`);
    console.error('='.repeat(60));
    console.error();
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error();
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the generator
main();
