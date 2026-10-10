#!/usr/bin/env node
// Write sitemap.xml and robots.txt for one of our static websites.
//
//   node build-sitemap.mjs <site folder> <https://host> [--out <folder>]
//
// The sitemap lists every public page of the site, so Google can find pages
// that nothing links to yet. A page is listed when it is an .html file the
// site's git repository tracks (every file in the folder when it is not a
// repository) and it is not one of these:
//   - a redirect stub (a meta refresh), or a page marked noindex
//   - a page whose canonical link names some other address
//   - a fragment with no <title> (a header snippet, say)
//   - 404.html, a test page called probe.html, or a Google ownership file
//     (google<hex>.html)
//   - anything under a folder called draft, drafts, mock or mocks
//
// robots.txt keeps whatever the site already says and gains a Sitemap line if
// it lacks one. A site with no robots.txt gets one that allows everything.
//
// Both files are written to --out (default: the site folder). Deploy scripts
// pass their staging folder so the published copy always matches the pages.
// This file is copied into the agentmesh.ai and dev.agentmesh.ai repositories;
// the copy in AgentMesh/tools is the original.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const out = outAt >= 0 ? args.splice(outAt, 2)[1] : null;
const [siteDir, origin] = args;
if (!siteDir || !/^https:\/\/[^/]+$/.test(origin || '')) {
  console.error('usage: node build-sitemap.mjs <site folder> <https://host> [--out <folder>]');
  process.exit(2);
}
const outDir = out || siteDir;

function trackedPages() {
  try {
    const listed = execFileSync('git', ['ls-files', '-z', '--', '*.html'], { cwd: siteDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return listed.split('\0').filter(Boolean);
  } catch {
    const found = [];
    const walk = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.html')) found.push(relative(siteDir, p).split(sep).join('/'));
      }
    };
    walk(siteDir);
    return found;
  }
}

const SKIP_DIR = /(^|\/)(drafts?|mocks?)\//i;
const SKIP_FILE = /(^|\/)(404\.html|probe\.html|google[0-9a-f]+\.html)$/i;

function urlFor(page) {
  return origin + '/' + page.replace(/(^|\/)index\.html$/, '$1');
}

function isPublic(page) {
  if (SKIP_DIR.test(page) || SKIP_FILE.test(page)) return false;
  const file = join(siteDir, page);
  if (!existsSync(file)) return false;
  const html = readFileSync(file, 'utf8');
  if (!/<title[\s>]/i.test(html)) return false;
  if (/<meta[^>]+http-equiv=["']?refresh/i.test(html)) return false;
  for (const tag of html.match(/<meta[^>]*>/gi) || []) {
    if (/name=["']?robots/i.test(tag) && /noindex/i.test(tag)) return false;
  }
  const canon = /<link[^>]+rel=["']?canonical["']?[^>]*>/i.exec(html);
  if (canon) {
    const href = /href=["']([^"']+)["']/i.exec(canon[0]);
    if (href && href[1].replace(/\/$/, '') !== urlFor(page).replace(/\/$/, '')) return false;
  }
  return true;
}

const urls = trackedPages().filter(isPublic).map(urlFor)
  .sort((a, b) => (a === origin + '/' ? -1 : b === origin + '/' ? 1 : a.localeCompare(b)));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `  <url><loc>${esc(u)}</loc></url>\n`).join('')
  + '</urlset>\n';
writeFileSync(join(outDir, 'sitemap.xml'), xml);

const line = `Sitemap: ${origin}/sitemap.xml`;
const robotsAt = join(siteDir, 'robots.txt');
let robots = existsSync(robotsAt) ? readFileSync(robotsAt, 'utf8') : 'User-agent: *\nAllow: /\n';
if (!robots.split(/\r?\n/).some((l) => l.trim().toLowerCase() === line.toLowerCase())) {
  robots = robots.replace(/\s*$/, '\n') + '\n' + line + '\n';
}
writeFileSync(join(outDir, 'robots.txt'), robots);

console.log(`sitemap.xml: ${urls.length} pages for ${origin}`);
