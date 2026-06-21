// scripts/build-pacotes.mjs
//
// Build-time script for the Mesquita Turismo static site.
//
// Fetches published travel packages from a public Supabase table and injects
// them into index.html as static HTML cards + JSON-LD before each Vercel
// deploy, so AI crawlers and search engines see real, fresh package data
// without depending on any client-side JS.
//
// Design goals:
// - Zero new npm dependencies (Node 18+ on Vercel ships native fetch).
// - Fail SOFT on anything data-related (missing env vars, network errors,
//   bad responses, zero rows): warn and exit 0, leaving index.html untouched.
//   A flaky Supabase response should never block a deploy.
// - Fail HARD only if the HTML markers this script depends on are missing,
//   since that means the page structure is broken, not a transient data issue.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_HTML_PATH = path.join(__dirname, '..', 'index.html');

const WHATSAPP_NUMBER = '5511953967095';
const SITE_URL = 'https://www.mesquitaturismo.com.br/#pacotes';

const PACOTES_START = '<!-- PACOTES:START -->';
const PACOTES_END = '<!-- PACOTES:END -->';
const JSONLD_START = '<!-- PACOTES_JSONLD:START -->';
const JSONLD_END = '<!-- PACOTES_JSONLD:END -->';

/**
 * Escapes regex special characters so a literal string can be safely used
 * inside `new RegExp(...)`.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Minimal HTML-escaping for untrusted text interpolated into markup.
 * Covers the characters that matter for breaking out of attributes/tags.
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Best-effort date formatter for free-text date strings coming from the
 * database (`ida` / `volta`). These may or may not be ISO-parseable.
 * If parsing fails, returns the original string unchanged. Uses UTC date
 * parts to avoid local-timezone shifting the displayed day.
 *
 * IMPORTANT: production data for `ida`/`volta` comes through as Brazilian
 * day-first slash dates, e.g. "11/10/2026" (11 de outubro). Native
 * `new Date("11/10/2026")` parses that as US-style mm/dd/yyyy instead,
 * silently swapping day and month whenever the day is <= 12 (it only
 * fails loudly, as Invalid Date, when day > 12). That swap is undetectable
 * via isNaN, so a plain `new Date(value)` pass is not safe here. We detect
 * the day-first slash shape explicitly and parse it ourselves; anything
 * else falls through to generic Date parsing, and anything unparseable
 * falls back to the original string unchanged.
 */
function formatDateLoose(value) {
  if (value === null || value === undefined || value === '') return '';

  const str = String(value).trim();

  // Brazilian day-first slash format: D/M/YYYY or DD/MM/YYYY (confirmed
  // shape of real `ida`/`volta` values). Parse the parts directly instead
  // of handing the ambiguous string to Date().
  const brDateMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const [, dayStr, monthStr, yearStr] = brDateMatch;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dd = String(day).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      return `${dd}/${mm}/${year}`;
    }
    // Out-of-range day/month for this shape — fall back to original string
    // rather than guessing.
    return str;
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) {
    return str;
  }
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Replaces everything between a pair of HTML comment markers (exclusive of
 * the markers themselves) with new content, re-emitting the markers.
 * Throws if the marker pair cannot be found in the given HTML.
 */
function replaceBetweenMarkers(html, startMarker, endMarker, newContent) {
  const escapedStart = escapeRegex(startMarker);
  const escapedEnd = escapeRegex(endMarker);
  const regex = new RegExp(escapedStart + '[\\s\\S]*?' + escapedEnd, 'm');

  if (!regex.test(html)) {
    throw new Error(
      `[build-pacotes] Marker pair not found in index.html: "${startMarker}" ... "${endMarker}"`
    );
  }

  return html.replace(regex, startMarker + '\n' + newContent + '\n' + endMarker);
}

function buildCardHtml(row) {
  const destino = escapeHtml(row.destino || '');
  const hotel = row.hotel ? escapeHtml(row.hotel) : '';
  const regiao = row.regiao ? escapeHtml(row.regiao) : 'Pacote';
  const coverImage = escapeHtml(row.cover_image_url || '');

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(row.preco) || 0);

  const formattedIda = formatDateLoose(row.ida);
  const formattedVolta = formatDateLoose(row.volta);

  const waMessage = encodeURIComponent(
    'Quero saber mais sobre o pacote para ' + (row.destino || '')
  );
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return `<div class="mcard">
  <div class="mcard-img"><img src="${coverImage}" alt="${destino}" onerror="this.parentNode.style.background='var(--blue-lt)'"></div>
  <div class="mcard-body">
    <span class="mcard-badge blue">${regiao}</span>
    <div class="mcard-title">${destino}${hotel ? ' — ' + hotel : ''}</div>
    <div class="mcard-desc">${formattedPrice} · ${formattedIda} a ${formattedVolta}</div>
    <a class="mcard-link" href="${waLink}" target="_blank">Falar com consultor →</a>
  </div>
</div>`;
}

function buildJsonLd(rows) {
  const itemListElement = rows.map((row, i) => {
    const name = row.hotel ? `${row.destino} — ${row.hotel}` : row.destino;
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name,
        image: row.cover_image_url || undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BRL',
          price: Number(row.preco) || 0,
          url: SITE_URL,
          availability: 'https://schema.org/InStock',
        },
      },
    };
  });

  const jsonLdObj = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
  };

  return `<script type="application/ld+json">\n${JSON.stringify(jsonLdObj, null, 2)}\n</script>`;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[build-pacotes] SUPABASE_URL and/or SUPABASE_ANON_KEY not set — skipping pacotes injection, keeping existing static content.'
    );
    process.exit(0);
  }

  const endpoint =
    `${SUPABASE_URL}/rest/v1/posts` +
    `?select=slug,title,destino,hotel,preco,ida,volta,regiao,cover_image_url` +
    `&status=eq.published` +
    `&order=published_at.desc` +
    `&limit=9`;

  let rows;
  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) {
      console.warn(
        `[build-pacotes] Supabase request failed with status ${res.status} ${res.statusText} — keeping existing static content.`
      );
      process.exit(0);
    }

    rows = await res.json();
  } catch (err) {
    console.warn('[build-pacotes] Error fetching from Supabase — keeping existing static content:', err);
    process.exit(0);
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn('[build-pacotes] 0 published posts found — keeping existing static content');
    process.exit(0);
  }

  const cardsHtml = rows.map(buildCardHtml).join('\n');
  const gridHtml = `<div class="media-grid">\n${cardsHtml}\n</div>`;
  const jsonLdHtml = buildJsonLd(rows);

  let html;
  try {
    html = await readFile(INDEX_HTML_PATH, 'utf8');

    html = replaceBetweenMarkers(html, PACOTES_START, PACOTES_END, gridHtml);
    html = replaceBetweenMarkers(html, JSONLD_START, JSONLD_END, jsonLdHtml);
  } catch (err) {
    console.error('[build-pacotes]', err.message || err);
    process.exit(1);
  }

  await writeFile(INDEX_HTML_PATH, html, 'utf8');

  console.log(`[build-pacotes] Success: wrote ${rows.length} package(s) into index.html`);
  process.exit(0);
}

main();
