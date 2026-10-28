// scripts/indexnow.mjs
//
// Build-time step: tells Bing (and the other IndexNow engines) which pages
// changed, so new promoções/praias/resorts pages show up in Bing — and in the
// ChatGPT search, which leans on Bing — without waiting for a crawl. Sends the
// sitemap URLs whose <lastmod> is today or yesterday (São Paulo time); with
// --all it sends every URL (used once, by hand). Only runs on the production
// deploy and never fails the build.
//
// The key file (<KEY>.txt at the site root) proves the site is ours.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'www.mesquitaturismo.com.br';
const KEY = '20649ffb9a6781838d82a6e490bf9ae6';
const ALL = process.argv.includes('--all');

if (!ALL && process.env.VERCEL_ENV !== 'production') {
  console.log('[indexnow] Not a production deploy, skipping.');
  process.exit(0);
}

const dia = offset => new Date(Date.now() - offset * 864e5)
  .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const recentes = new Set([dia(0), dia(1)]);

try {
  const xml = await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map(([, u]) => ({ loc: u.match(/<loc>([^<]+)/)?.[1], mod: u.match(/<lastmod>([^<]+)/)?.[1] }))
    .filter(u => u.loc && (ALL || recentes.has(u.mod)))
    .map(u => u.loc);

  if (!urls.length) {
    console.log('[indexnow] No recently changed URLs.');
    process.exit(0);
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(15000),
  });
  console.log(`[indexnow] Sent ${urls.length} URL(s): HTTP ${res.status}`);
} catch (err) {
  console.warn(`[indexnow] Failed (build continues): ${err.message}`);
}
