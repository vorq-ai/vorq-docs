// Pulls docs/ from every repo in sources.json into src/content/docs/<slug>/.
// Env: GITHUB_TOKEN (read access to the source repos), BANNED_TERMS (comma-separated).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const token = process.env.GITHUB_TOKEN;
const banned = (process.env.BANNED_TERMS ?? '').split(',').map((t) => t.trim()).filter(Boolean);
if (!token) throw new Error('GITHUB_TOKEN is required');
if (!banned.length) throw new Error('BANNED_TERMS is required');

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sources = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'));
const bannedRe = new RegExp(`\\b(${banned.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');

// index.md and quickstart.md at the top, everything else in one of three flat folders.
const LAYOUT = /^((index|quickstart)\.md|(guides|concepts|reference)\/[a-z0-9-]+\.mdx?)$/;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// Relative links to sibling .md pages become absolute site routes.
const rewriteLinks = (text, slug, fileRel) =>
  text.replace(/\]\((?!https?:|#|\/|mailto:)([^)\s]+?\.mdx?)(#[^)\s]*)?\)/g, (_, target, hash = '') => {
    const page = posix.normalize(posix.join(posix.dirname(fileRel), target)).replace(/\.mdx?$/, '');
    const route = page === 'index' ? '' : `${page.replace(/(^|\/)index$/, '').toLowerCase()}/`;
    return `](/${slug}/${route}${hash})`;
  });

const failures = [];
for (const { repo, slug } of sources) {
  const tmp = mkdtempSync(join(tmpdir(), `${repo}-`));
  const url = `https://x-access-token:${token}@github.com/vorq-ai/${repo}.git`;
  execFileSync('git', ['clone', '--quiet', '--depth', '1', '--filter=blob:none', '--sparse', url, tmp], { stdio: 'inherit' });
  execFileSync('git', ['-C', tmp, 'sparse-checkout', 'set', 'docs'], { stdio: 'inherit' });

  const src = join(tmp, 'docs');
  const out = join(root, 'src/content/docs', slug);
  rmSync(out, { recursive: true, force: true });
  const pages = walk(src).filter((f) => /\.mdx?$/.test(f));
  const rels = pages.map((f) => relative(src, f).split('\\').join('/'));
  for (const required of ['index.md', 'quickstart.md']) {
    if (!rels.includes(required)) failures.push(`${repo}/docs/${required}: required page is missing`);
  }
  for (const rel of rels) {
    if (!LAYOUT.test(rel)) failures.push(`${repo}/docs/${rel}: outside the docs layout`);
  }

  for (const [i, file] of pages.entries()) {
    const rel = rels[i];
    const text = readFileSync(file, 'utf8');
    text.split("\n").forEach((line, n) => {
      if (bannedRe.test(line)) failures.push(`${repo}/docs/${rel}:${n + 1}: banned term`);
    });
    const dest = join(out, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, rewriteLinks(text, slug, rel));
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${repo}: ${pages.length} pages -> /${slug}/`);
}

if (failures.length) {
  console.error(`Docs checks failed:\n${failures.join('\n')}`);
  process.exit(1);
}
