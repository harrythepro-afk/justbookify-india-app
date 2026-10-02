// Dependency audit gate for CI. Fails on any high or critical advisory that is not listed in
// .github/audit-allowlist.json. Every allowlist entry carries a reason and a review-by date;
// an entry past its date fails the gate, so an exception cannot be forgotten.
//
// Why not plain `npm audit --audit-level=high`: some advisories sit in Expo's own tooling and
// have no patched release. A permanently red check teaches people to ignore it.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FAIL_SEVERITIES = new Set(['high', 'critical']);
const ALLOWLIST_PATH = new URL('../.github/audit-allowlist.json', import.meta.url);

function runAudit() {
  try {
    return execSync('npm audit --json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // `npm audit` exits non-zero when it finds anything. The report is still on stdout.
    if (typeof error.stdout === 'string' && error.stdout.trim().startsWith('{')) {
      return error.stdout;
    }
    throw error;
  }
}

function collectAdvisories(report) {
  const found = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via) {
      if (typeof via !== 'object') continue;
      const id = via.url.split('/').pop();
      found.set(id, { id, severity: via.severity, package: via.name, title: via.title });
    }
  }
  return [...found.values()];
}

const report = JSON.parse(runAudit());
if (report.error) {
  console.error(`npm audit failed: ${report.error.summary ?? report.error.code}`);
  process.exit(1);
}

const allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
const advisories = collectAdvisories(report);
const today = new Date().toISOString().slice(0, 10);
const problems = [];

for (const entry of allowlist) {
  if (entry.reviewBy < today) {
    problems.push(
      `Allowlist entry ${entry.id} (${entry.package}) is past its review date ${entry.reviewBy}.`,
    );
  }
}

const allowed = new Map(allowlist.map((entry) => [entry.id, entry]));
for (const advisory of advisories) {
  const label = `${advisory.severity} ${advisory.id} in ${advisory.package}: ${advisory.title}`;
  if (!FAIL_SEVERITIES.has(advisory.severity)) {
    console.log(`info     ${label}`);
  } else if (allowed.has(advisory.id)) {
    console.log(`allowed  ${label}\n         ${allowed.get(advisory.id).reason}`);
  } else {
    problems.push(`Unreviewed ${label}`);
  }
}

const present = new Set(advisories.map((advisory) => advisory.id));
for (const entry of allowlist) {
  if (!present.has(entry.id)) {
    console.log(`stale    ${entry.id} is allowlisted but no longer reported. Remove it.`);
  }
}

if (problems.length > 0) {
  console.error(`\nAudit gate failed:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
  process.exit(1);
}
console.log('\nAudit gate passed.');
