#!/usr/bin/env node
// Language hygiene for every {en, zh} pair the site renders.
//
//   - an `en` string must not contain Chinese
//   - a `zh` string must not contain a run of 4+ English words (tickers,
//     acronyms and maths are fine; sentences are not)
//   - zh terminology: 看涨 / 看跌, never 认购 / 认沽
//
// Scans content.json files, and {en:'…', zh:'…'} literals in .ts/.tsx/.js.
// Usage: node scripts/check-lang.mjs [dir...]   (default: site/src)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CJK = /[㐀-鿿豈-﫿]/;
const EN_RUN = /\b[A-Za-z][a-z]+(?:[\s,'-]+[A-Za-z][a-z]+){3,}\b/;
const BANNED = [['认购', '看涨'], ['认沽', '看跌']];

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['site/src'];
const problems = [];

function checkPair(file, where, en, zh) {
  if (typeof en === 'string' && CJK.test(en)) problems.push(`${file} ${where}: Chinese in en → ${en.slice(0, 80)}`);
  if (typeof zh !== 'string') return;
  const run = zh.match(EN_RUN);
  if (run) problems.push(`${file} ${where}: English sentence in zh → "${run[0]}"`);
  for (const [bad, good] of BANNED) if (zh.includes(bad)) problems.push(`${file} ${where}: use ${good} not ${bad}`);
}

function walkJson(file, node, path) {
  if (Array.isArray(node)) return node.forEach((n, i) => walkJson(file, n, `${path}[${i}]`));
  if (!node || typeof node !== 'object') return;
  if ('en' in node || 'zh' in node) {
    const en = Array.isArray(node.en) ? node.en.join(' ') : node.en;
    const zh = Array.isArray(node.zh) ? node.zh.join(' ') : node.zh;
    checkPair(file, path, en, zh);
  }
  for (const [k, v] of Object.entries(node)) walkJson(file, v, path ? `${path}.${k}` : k);
}

const LIT = /en:\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,\s*zh:\s*(['"`])((?:\\.|(?!\3).)*)\3/g;

function scan(file) {
  const rel = relative(process.cwd(), file);
  const src = readFileSync(file, 'utf8');
  if (file.endsWith('.json')) return walkJson(rel, JSON.parse(src), '');
  for (const m of src.matchAll(LIT)) {
    const line = src.slice(0, m.index).split('\n').length;
    checkPair(rel, `:${line}`, m[2], m[4]);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'node_modules' || name === 'legacy') continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(json|tsx?|js)$/.test(name)) scan(p);
  }
}

roots.forEach(walk);
// Legacy engine strings are rendered too, so check their vocabulary files.
for (const r of roots) {
  try {
    for (const page of readdirSync(join(r, 'pages'))) {
      const f = join(r, 'pages', page, 'legacy', 'strings.js');
      try { statSync(f); scan(f); } catch { /* page has no strings.js */ }
    }
  } catch { /* root has no pages dir */ }
}

for (const p of problems) console.log(p);
console.log(problems.length ? `\n${problems.length} problem(s)` : 'language check: clean');
process.exit(problems.length ? 1 : 0);
