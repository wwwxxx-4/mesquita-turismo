// scripts/cliques.mjs
//
// Build-time step (16/11/2026). Makes contacts measurable in Vercel Web Analytics (Hobby plan,
// which has no custom events):
//  1. Every page gets a click listener. A click on WhatsApp (wa.me / api.whatsapp), on the
//     WhatsApp channel or on one of our short links (/v/...) is recorded as a virtual pageview
//     at /clique/<tipo>/<page path>. The link itself is untouched (no redirect, no extra tap).
//     In the Analytics panel, filter the pages by "/clique/" to see which page sends contacts.
//  2. Short-link pages (/v/<code>/) redirected instantly, before the analytics script could send
//     the visit, so a link opened from WhatsApp/Instagram was never counted. Now the redirect
//     waits ~0.7 s; the meta refresh stays as fallback.
// Pages already processed are left alone, so the step is safe to run on every deploy.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', '.vercel', 'scripts']);
const MARCA = 'data-cliques';

const TAG = `<script ${MARCA}>document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||typeof window.va!=='function')return;var h=a.href,t=/whatsapp\\.com\\/channel|\\/v\\/qmfge8/.test(h)?'canal':/wa\\.me\\/|api\\.whatsapp\\.com\\/send/.test(h)?'whatsapp':/mesquitaturismo\\.com\\.br\\/v\\//.test(h)?'link':/comprarviagem\\.com\\.br/.test(h)?'loja':'';if(!t)return;var p='/clique/'+t+(location.pathname.replace(/\\/+$/,'')||'/inicio');try{window.va('pageview',{route:p,path:p})}catch(x){}},true);</script>\n`;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

let ouvinte = 0, curtos = 0;
for await (const file of htmlFiles(ROOT)) {
  let html = await readFile(file, 'utf8');
  const antes = html;
  const rel = path.relative(ROOT, file).split(path.sep);
  if (rel[0] === 'v' && rel.length === 3) {
    // short link: delay the JS redirect so the Vercel script can send the visit
    html = html
      .replace(/<script>location\.replace\((".*?")\);<\/script>/, '<script>setTimeout(function(){location.replace($1)},700);</script>')
      .replace(/content="0; url=/, 'content="2; url=');
    if (html !== antes) curtos++;
  } else if (!html.includes(MARCA) && /<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, TAG + '</body>');
    ouvinte++;
  }
  if (html !== antes) await writeFile(file, html, 'utf8');
}
console.log(`[cliques] click tracking added to ${ouvinte} page(s); ${curtos} short link(s) now wait for analytics`);
