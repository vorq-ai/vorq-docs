// Fails the build on a link in out/ that points to a missing page or heading.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(dirname(fileURLToPath(import.meta.url))), 'out');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};

// The file a site path is served from, or null: /a/b is a/b, a/b.html or a/b/index.html.
const resolve = (path) => {
  const target = join(out, decodeURIComponent(path));
  return [target, `${target}.html`, join(target, 'index.html')].find((f) => existsSync(f) && statSync(f).isFile()) ?? null;
};

const failures = [];
const pages = walk(out).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const page = `/${relative(out, file).split('\\').join('/')}`.replace(/(index)?\.html$/, '');
  const html = readFileSync(file, 'utf8');
  for (const [, raw] of html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    const href = raw.replaceAll('&amp;', '&');
    if (/^([a-z]+:|\/\/)/i.test(href)) continue;
    const [pathPart, hash] = href.split('#');
    const path = pathPart === '' ? page : posix.resolve(posix.dirname(`${page}x`), pathPart.split('?')[0]);
    const target = resolve(path);
    if (!target) failures.push(`${page}: ${href} (no such page)`);
    else if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) {
      failures.push(`${page}: ${href} (no such heading)`);
    }
  }
}

if (failures.length) {
  console.error(`Broken links:\n${[...new Set(failures)].join('\n')}`);
  process.exit(1);
}
console.log(`Links OK in ${pages.length} pages`);
