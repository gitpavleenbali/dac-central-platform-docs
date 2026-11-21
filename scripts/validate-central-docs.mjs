#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
let checkedMdFiles = 0;
let checkedMermaidBlocks = 0;
let checkedLinks = 0;

function walkMarkdown(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

function validateMermaid(src, relPath, idx) {
  const lines = src.trim().split(/\r?\n/);
  if (!/^(flowchart|graph)\s+(TB|TD|BT|RL|LR)\b/.test(lines[0] || '') && !/^sequenceDiagram\b/.test(lines[0] || '')) {
    errors.push(`${relPath} [mermaid #${idx}]: Invalid diagram header "${lines[0]}"`);
  }
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('%%')) continue;
    if (/^subgraph\b/.test(l)) {
      depth++;
      if (l.includes('[') && !/^subgraph\s+[A-Za-z0-9_]+\["[^"]*"\]$/.test(l)) {
        errors.push(`${relPath} [mermaid #${idx}, line ${i + 1}]: Unquoted subgraph title: ${l}`);
      }
      continue;
    }
    if (l === 'end') {
      depth--;
      if (depth < 0) errors.push(`${relPath} [mermaid #${idx}, line ${i + 1}]: Extra 'end'`);
      continue;
    }
    if (/^class(Def)?\b/.test(l)) continue;
    const badLabel = l.match(/[A-Za-z0-9_]+\[(?![("])([^\]]*[():][^\]]*)\]/);
    if (badLabel) {
      errors.push(`${relPath} [mermaid #${idx}, line ${i + 1}]: Unquoted special chars in label: ${badLabel[0]}`);
    }
    if (((l.match(/"/g) || []).length % 2) !== 0) {
      errors.push(`${relPath} [mermaid #${idx}, line ${i + 1}]: Unbalanced quotes: ${l}`);
    }
  }
  if (depth !== 0) errors.push(`${relPath} [mermaid #${idx}]: Unbalanced subgraph depth=${depth}`);
}

for (const mdFile of walkMarkdown(root)) {
  if (mdFile.includes(`${path.sep}.github${path.sep}agents${path.sep}`)) continue;
  checkedMdFiles++;
  const rel = path.relative(root, mdFile);
  const text = fs.readFileSync(mdFile, 'utf8');

  // 1. Validate DAC managed markers balance
  const begins = [...text.matchAll(/<!--\s*BEGIN DAC:([A-Za-z0-9_-]+)[^>]*-->/g)].map((m) => m[1]);
  const ends = [...text.matchAll(/<!--\s*END DAC:([A-Za-z0-9_-]+)\s*-->/g)].map((m) => m[1]);
  if (begins.length !== ends.length || begins.join(',') !== ends.join(',')) {
    errors.push(`${rel}: Mismatched DAC managed block markers (${begins.join(',')} vs ${ends.join(',')})`);
  }

  // 2. Validate Mermaid blocks
  const mRe = /```mermaid\r?\n([\s\S]*?)```/g;
  let m;
  let bIdx = 0;
  while ((m = mRe.exec(text)) !== null) {
    bIdx++;
    checkedMermaidBlocks++;
    validateMermaid(m[1], rel, bIdx);
  }

  // 3. Validate local relative links
  const linkRe = /\[[^\]]+\]\((\.[^)#\s]+)\)/g;
  let lm;
  while ((lm = linkRe.exec(text)) !== null) {
    checkedLinks++;
    const resolved = path.resolve(path.dirname(mdFile), lm[1]);
    if (!fs.existsSync(resolved)) {
      errors.push(`${rel}: Broken relative link -> ${lm[1]}`);
    }
  }
}

// 4. Validate provenance files per product folder
const productsDir = path.join(root, 'products');
if (fs.existsSync(productsDir)) {
  for (const prod of fs.readdirSync(productsDir, { withFileTypes: true })) {
    if (!prod.isDirectory()) continue;
    const provPath = path.join(productsDir, prod.name, 'dac-provenance.json');
    if (!fs.existsSync(provPath)) {
      errors.push(`products/${prod.name}: Missing dac-provenance.json`);
      continue;
    }
    const prov = JSON.parse(fs.readFileSync(provPath, 'utf8'));
    for (const reqField of ['serviceId', 'hostingModel', 'sourceRepo', 'sourceCommit', 'semanticHash']) {
      if (!prov[reqField]) errors.push(`products/${prod.name}/dac-provenance.json: Missing ${reqField}`);
    }
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedMdFiles,
      checkedMermaidBlocks,
      checkedLinks
    },
    null,
    2
  )
);
