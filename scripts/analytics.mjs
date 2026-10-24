// scripts/analytics.mjs
//
// Build-time step: adds the Vercel Web Analytics tag before </head> in every
// HTML page of the site. Runs on each deploy, so pages created later by the
// daily routines (promoções, praias, resorts...) are covered without anyone
// remembering to paste the tag. Pages that already have it are left alone.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', '.vercel', 'scripts']);

const TAG =
  '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>\n' +
  '<script defer src="/_vercel/insights/script.js"></script>\n';

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

let added = 0;
for await (const file of htmlFiles(ROOT)) {
  const html = await readFile(file, 'utf8');
  if (html.includes('/_vercel/insights/script.js') || !/<\/head>/i.test(html)) continue;
  await writeFile(file, html.replace(/<\/head>/i, TAG + '</head>'), 'utf8');
  added++;
}
console.log(`[analytics] Web Analytics tag added to ${added} page(s)`);
