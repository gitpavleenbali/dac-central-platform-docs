import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pages = {
  workload: {
    repo: 'gitpavleenbali/dac-workload-modernization',
    file: 'docs/architecture.md',
    anchor: '## Engineering Design Notes (Human-Maintained)'
  },
  central: {
    repo: 'gitpavleenbali/dac-central-platform-docs',
    file: 'products/grid-telemetry-service/architecture.md',
    anchor: '## Architectural Decision Records (ADRs) & Design Rationale'
  }
};

const begin = '<!-- BEGIN COPILOT:architecture-review -->';
const end = '<!-- END COPILOT:architecture-review -->';
const shaPattern = /^[a-f0-9]{40}$/;
const draftNotice = /^> Copilot draft for human review\. Based on source commit `[a-f0-9]{40}`\. This is not deployment evidence\.$/;

function plainText(value, limit) {
  return typeof value === 'string' && value.length >= 25 && value.length <= limit &&
    value === value.trim() && /^[\p{L}\p{N} .,'’():?–—-]+$/u.test(value);
}

export function buildProposal(original, output, { anchor, sourceSha, cluster }) {
  const proposals = Array.isArray(output?.items) && output.items.filter(item => item?.type === 'propose_doc_text');
  if (!proposals || proposals.length !== 1 || !shaPattern.test(sourceSha)) {
    throw new Error('Expected exactly one Copilot proposal and an exact source commit.');
  }
  const { summary, question } = proposals[0];
  if (!/^[a-z0-9-]{3,63}$/.test(cluster) || !plainText(summary, 300) ||
      !/^The proposal\b/.test(summary) || !summary.endsWith('.') || !summary.split(/[^a-z0-9-]+/i).includes(cluster) ||
      !/\b(AKS|Kubernetes Service)\b/.test(summary) || !/\b(VM|virtual machine)\b/i.test(summary) ||
      /\b(deployed|approved|retired|live in production)\b/i.test(summary) ||
      !plainText(question, 240) || !question.endsWith('?') || !/\b(cutover|rollback)\b/i.test(question)) {
    throw new Error('Copilot must cite the validated AKS cluster in plain text without claiming a rollout or approval, and ask a cutover or rollback question.');
  }
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const heading = `${anchor}${newline}`;
  const anchorIndex = original.indexOf(heading);
  if (anchorIndex < 0 || (anchorIndex > 0 && original[anchorIndex - 1] !== '\n') ||
      original.indexOf(heading, anchorIndex + heading.length) !== -1) {
    throw new Error('The expected architecture heading was not found exactly once.');
  }
  const section = [
    begin,
    '## Proposed migration review',
    '',
    `> Copilot draft for human review. Based on source commit \`${sourceSha}\`. This is not deployment evidence.`,
    '',
    summary,
    '',
    `**Question for reviewers:** ${question}`,
    end,
    '',
    ''
  ].join(newline);
  const start = original.indexOf(begin);
  const finish = original.indexOf(end);
  let replaceFrom = anchorIndex;
  if (start !== -1 || finish !== -1) {
    const draftLines = original.slice(start, finish + end.length).split(newline);
    if (start < 0 || finish <= start || original.indexOf(begin, start + begin.length) !== -1 ||
        original.indexOf(end, finish + end.length) !== -1 ||
        (start > 0 && original[start - 1] !== '\n') ||
        original.slice(finish + end.length, anchorIndex) !== newline.repeat(2) ||
        draftLines.length !== 9 || draftLines[1] !== '## Proposed migration review' ||
        draftLines[2] !== '' || !draftNotice.test(draftLines[3]) ||
        draftLines[4] !== '' || draftLines[6] !== '' ||
        !plainText(draftLines[5], 300) || !draftLines[7]?.startsWith('**Question for reviewers:** ') ||
        !plainText(draftLines[7].slice('**Question for reviewers:** '.length), 240)) {
      throw new Error('The existing Copilot draft markers do not bound the expected section.');
    }
    replaceFrom = start;
  }
  return { markdown: original.slice(0, replaceFrom) + section + original.slice(anchorIndex), summary, question };
}

function main([checkout, modelOutput, evidenceFile, outputDir]) {
  const scope = process.env.DAC_SCOPE;
  const page = Object.hasOwn(pages, scope) ? pages[scope] : null;
  const sourceSha = process.env.DAC_SOURCE_SHA;
  const headSha = process.env.DAC_REVIEWED_SHA;
  if (!page || page.repo !== process.env.GITHUB_REPOSITORY || !shaPattern.test(headSha) ||
      (scope === 'workload' && sourceSha !== headSha)) {
    throw new Error('Unexpected repository, review scope, or revision.');
  }
  const git = (...args) => execFileSync('git', args, { cwd: checkout, encoding: 'utf8' });
  if (git('rev-parse', 'HEAD').trim() !== headSha) throw new Error('The checkout does not match the validated revision.');
  const evidence = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
  if (evidence.headSha !== headSha || evidence.sourceSha !== sourceSha) {
    throw new Error('The evidence does not match the validated revisions.');
  }
  if (scope === 'central') {
    const provenance = JSON.parse(fs.readFileSync(path.join(checkout, path.dirname(page.file), 'dac-provenance.json'), 'utf8'));
    if (provenance.sourceCommit !== sourceSha) throw new Error('The central patch does not match the validated source commit.');
  }
  const target = path.join(checkout, page.file);
  if (!fs.lstatSync(target).isFile() ||
      fs.realpathSync(target) !== path.join(fs.realpathSync(checkout), page.file)) {
    throw new Error('The target must be an existing regular file within the checked-out tree.');
  }
  const original = fs.readFileSync(target, 'utf8');
  const text = JSON.parse(fs.readFileSync(modelOutput, 'utf8'));
  const { markdown, summary, question } = buildProposal(original, text, {
    anchor: page.anchor, sourceSha, cluster: evidence.cluster
  });
  fs.mkdirSync(outputDir, { recursive: true });
  const patchFile = path.resolve(outputDir, 'architecture.patch');
  let patch;
  try {
    fs.writeFileSync(target, markdown);
    if (git('diff', '--name-only', '--').trim() !== page.file) {
      throw new Error('Proposal must change only the existing architecture page.');
    }
    git('diff', '--check', '--', page.file);
    patch = git('diff', '--no-ext-diff', '--', page.file);
  } finally {
    fs.writeFileSync(target, original);
  }
  fs.writeFileSync(patchFile, patch);
  git('apply', '--check', patchFile);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.appendFileSync(summaryPath, [
      '## Verified Copilot proposal — not applied', '',
      `Existing page: \`${page.file}\``, `Reviewed revision: \`${headSha}\``,
      `Workload provenance: \`${sourceSha}\``, '',
      summary, '', `**Question for reviewers:** ${question}`, '',
      `Download \`dac-${scope}-architecture-proposal-${process.env.GITHUB_RUN_ATTEMPT}\` from this run to review the patch.`,
      'The generated diagrams, owner-written notes, and Git branches were not changed.', ''
    ].join('\n'));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
