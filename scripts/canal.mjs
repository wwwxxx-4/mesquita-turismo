// scripts/canal.mjs
//
// Build-time step (16/11/2026): adds the "siga o canal" strip (/assets/canal.js) before </body>
// in every HTML page, like analytics.mjs does for the Vercel tag. Pages created later by the
// daily routines are covered on the next deploy. Pages that already load it are left alone.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', '.vercel', 'scripts']);
const TAG = '<script defer src="/assets/canal.js"></script>\n';

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
  if (html.includes('/assets/canal.js') || !/<\/body>/i.test(html)) continue;
  await writeFile(file, html.replace(/<\/body>/i, TAG + '</body>'), 'utf8');
  added++;
}
console.log(`[canal] "siga o canal" strip added to ${added} page(s)`);
