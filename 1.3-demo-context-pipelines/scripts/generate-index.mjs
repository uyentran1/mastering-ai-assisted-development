/**
 * Video 1.3: Automated Context Pipelines
 *
 * Example script that auto-generates a project index for AI context.
 * Run this as a pre-commit hook or CI step to keep the index up to date.
 *
 * Usage: node scripts/generate-index.mjs
 */
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const IGNORE = ['node_modules', '.git', 'dist', 'coverage'];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE.includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|js|tsx|jsx|md)$/.test(entry)) {
      files.push({ path: relative(ROOT, full), size: stat.size });
    }
  }
  return files;
}

const files = walk(ROOT);
const index = [
  '# Project Index (auto-generated)',
  `Generated: ${new Date().toISOString()}`,
  `Files: ${files.length}`,
  '',
  '## File Tree',
  ...files.map((f) => `- ${f.path} (${f.size} bytes)`),
].join('\n');

writeFileSync(join(ROOT, 'PROJECT_INDEX.md'), index);
console.log(`Generated PROJECT_INDEX.md with ${files.length} files`);
