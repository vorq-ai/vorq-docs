// Pulls docs/ from every repo in sources.json into content/docs/<slug>/.
// Env: GITHUB_TOKEN (read access to the source repos), BANNED_TERMS (comma-separated).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const token = process.env.GITHUB_TOKEN;
const banned = (process.env.BANNED_TERMS ?? '').split(',').map((t) => t.trim()).filter(Boolean);
if (!token) throw new Error('GITHUB_TOKEN is required');
if (!banned.length) throw new Error('BANNED_TERMS is required');

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sources = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'));
const bannedRe = new RegExp(`\\b(${banned.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');

// index.md and quickstart.md at the top, everything else in one of three flat folders, each
// folder ordered by its meta.json.
const LAYOUT = /^((index|quickstart)\.md|((guides|concepts|reference)\/)?meta\.json|(guides|concepts|reference)\/[a-z0-9-]+\.mdx?)$/;
const REQUIRED = ['index.md', 'quickstart.md', 'meta.json'];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const failures = [];
const docsDir = join(root, 'content/docs');
for (const { repo, slug } of sources) {
  const tmp = mkdtempSync(join(tmpdir(), `${repo}-`));
  const url = `https://x-access-token:${token}@github.com/vorq-ai/${repo}.git`;
  execFileSync('git', ['clone', '--quiet', '--depth', '1', '--filter=blob:none', '--sparse', url, tmp], { stdio: 'inherit' });
  execFileSync('git', ['-C', tmp, 'sparse-checkout', 'set', 'docs'], { stdio: 'inherit' });

  const src = join(tmp, 'docs');
  const out = join(docsDir, slug);
  rmSync(out, { recursive: true, force: true });
  const files = walk(src).filter((f) => /\.(mdx?|json)$/.test(f));
  const rels = files.map((f) => relative(src, f).split('\\').join('/'));
  for (const required of REQUIRED) {
    if (!rels.includes(required)) failures.push(`${repo}/docs/${required}: required file is missing`);
  }

  for (const [i, file] of files.entries()) {
    const rel = rels[i];
    if (!LAYOUT.test(rel)) failures.push(`${repo}/docs/${rel}: outside the docs layout`);
    readFileSync(file, 'utf8').split('\n').forEach((line, n) => {
      if (bannedRe.test(line)) failures.push(`${repo}/docs/${rel}:${n + 1}: banned term`);
    });
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    copyFileSync(file, join(out, rel));
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${repo}: ${files.length} files -> content/docs/${slug}/`);
}

// The order of the sections in the section switcher.
writeFileSync(join(docsDir, 'meta.json'), `${JSON.stringify({ pages: ['overview', ...sources.map((s) => s.slug)] }, null, 2)}\n`);

if (failures.length) {
  console.error(`Docs checks failed:\n${failures.join('\n')}`);
  process.exit(1);
}
