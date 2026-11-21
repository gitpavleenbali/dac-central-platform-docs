import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildProposal } from '../scripts/verify-agent-proposal.mjs';

const anchor = '## Architectural Decision Records (ADRs) & Design Rationale';
const sourceSha = 'a'.repeat(40);
const cluster = 'aks-grid-telemetry-prod';
const generated = '# Architecture\n\n<!-- BEGIN DAC:topology -->\n```mermaid\nflowchart LR\n  A --> B\n```\n<!-- END DAC:topology -->\n\n';
const ownerProse = `${anchor}\n\nOwner-written rationale.\n`;
const item = {
  type: 'propose_doc_text',
  summary: 'The proposal moves grid-telemetry from a VM to the declared AKS cluster aks-grid-telemetry-prod.',
  question: 'What rollback trigger should the service owner approve before cutover?'
};
const make = (original, items = [item]) => buildProposal(original, { items }, { anchor, sourceSha, cluster }).markdown;

test('a proposal inserts or replaces one draft without changing diagrams or owner prose', () => {
  const first = make(generated + ownerProse);
  const second = make(first, [{ ...item, question: 'What runtime evidence should determine the rollback decision?' }]);
  assert.ok(second.startsWith(generated));
  assert.ok(second.endsWith(ownerProse));
  assert.equal(second.match(/BEGIN COPILOT:architecture-review/g).length, 1);
  assert.match(second, /What runtime evidence/);
  assert.doesNotMatch(second, /What rollback trigger/);
});

test('missing, duplicate, malformed, and unbounded agent proposals are rejected', () => {
  const original = generated + ownerProse;
  assert.throws(() => make(original, []), /exactly one/);
  assert.throws(() => make(original, [item, item]), /exactly one/);
  assert.throws(() => make(original, [{ ...item, summary: `${item.summary}\n\n## Replacement diagram` }]), /plain text/);
  assert.throws(() => make(original, [{ ...item, summary: item.summary.replace(cluster, `${cluster}-other`) }]), /validated AKS cluster/);
  assert.throws(() => make(original, [{ ...item, summary: item.summary.replace('moves', 'was approved and moves') }]), /rollout or approval/);
  assert.throws(() => make(generated + `<!-- BEGIN COPILOT:architecture-review -->\n${ownerProse}`), /markers/);
  assert.throws(() => make(`<!-- BEGIN COPILOT:architecture-review -->\n${generated}<!-- END COPILOT:architecture-review -->\n\n${ownerProse}`), /markers/);
  const draft = make(original);
  assert.throws(() => make(draft.replace('## Proposed migration review\n\n', '## Proposed migration review\nOwner note\n')), /markers/);
  assert.throws(() => make(generated), /heading/);
});

test('the verifier creates an applicable patch for the exact reviewed central revision', () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dac-proposal-test-'));
  try {
    const checkout = path.join(scratch, 'checkout');
    const page = 'products/grid-telemetry-service/architecture.md';
    const target = path.join(checkout, page);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, generated + ownerProse);
    fs.writeFileSync(path.join(path.dirname(target), 'dac-provenance.json'), JSON.stringify({ sourceCommit: sourceSha }));
    const git = (...args) => execFileSync('git', args, { cwd: checkout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    git('init', '-q');
    git('config', 'core.autocrlf', 'false');
    git('add', '.');
    git('-c', 'user.name=DaC test', '-c', 'user.email=dac@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture');
    const headSha = git('rev-parse', 'HEAD');
    const modelOutput = path.join(scratch, 'response.json');
    const evidence = path.join(scratch, 'facts.json');
    const output = path.join(scratch, 'output');
    fs.writeFileSync(modelOutput, JSON.stringify({ items: [item] }));
    fs.writeFileSync(evidence, JSON.stringify({ headSha, sourceSha, cluster }));
    const script = fileURLToPath(new URL('../scripts/verify-agent-proposal.mjs', import.meta.url));
    const verify = (sha) => execFileSync(process.execPath, [script, checkout, modelOutput, evidence, output], {
      env: {
        ...process.env, DAC_SCOPE: 'central', DAC_REVIEWED_SHA: sha, DAC_SOURCE_SHA: sourceSha,
        GITHUB_REPOSITORY: 'gitpavleenbali/dac-central-platform-docs', GITHUB_STEP_SUMMARY: ''
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    assert.throws(() => verify(sourceSha), /checkout does not match/);
    verify(headSha);
    assert.equal(git('status', '--porcelain'), '');
    git('apply', path.join(output, 'architecture.patch'));
    assert.equal(git('diff', '--name-only'), page);
    const updated = fs.readFileSync(target, 'utf8');
    assert.ok(updated.startsWith(generated));
    assert.ok(updated.endsWith(ownerProse));
    assert.match(updated, /Proposed migration review/);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
