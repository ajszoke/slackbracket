#!/usr/bin/env bash
# Add a game result to the results JSON.
#
# Usage:
#   ./scripts/update-results.sh <matchup_id> <winner_team_name> [men|women]
#
# Examples:
#   ./scripts/update-results.sh R1-East-1 Duke
#   ./scripts/update-results.sh R1-East-2 "Ohio St."
#   ./scripts/update-results.sh R2-West-1 Auburn
#
# Validates matchup ID, resolves team name to ID, flags upsets.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MATCHUP_ID="${1:?Usage: $0 <matchup_id> <winner_team_name> [men|women]}"
WINNER_NAME="${2:?Usage: $0 <matchup_id> <winner_team_name> [men|women]}"
GENDER="${3:-men}"

BRACKET_FILE="${REPO_ROOT}/apps/web/public/data/bracket_${GENDER}.json"
RESULTS_FILE="${REPO_ROOT}/apps/web/public/data/results_${GENDER}.json"

node -e "
const fs = require('fs');

const bracketFile = '${BRACKET_FILE}';
const resultsFile = '${RESULTS_FILE}';
const matchupId = '${MATCHUP_ID}';
const winnerName = '${WINNER_NAME}';

// Validate matchup ID format
if (!/^R[1-6]-(East|West|South|Midwest|FinalFour)-\d+$/.test(matchupId)) {
  console.error('ERROR: Invalid matchup ID \"' + matchupId + '\"');
  console.error('Expected format: R{1-6}-{Region}-{slot}');
  process.exit(1);
}

// Load bracket data
const teams = JSON.parse(fs.readFileSync(bracketFile, 'utf8'));

// Find winner team (case-insensitive)
const winner = teams.find(t => t.team.toLowerCase() === winnerName.toLowerCase());
if (!winner) {
  console.error('ERROR: Team \"' + winnerName + '\" not found in bracket data.');
  console.error('Available teams (first 10):');
  teams.slice(0, 10).forEach(t => console.error('  ' + t.team + ' (' + t.region + ' ' + t.seed + ')'));
  console.error('  ...');
  process.exit(1);
}

// Construct team ID (same as normalizeTeams)
const winnerId = (winner.region + '-' + winner.seed + '-' + winner.team)
  .toLowerCase()
  .replaceAll(' ', '-')
  .replaceAll('.', '')
  .replaceAll(\"'\", '');

// Load existing results
let results = [];
try { results = JSON.parse(fs.readFileSync(resultsFile, 'utf8')); } catch {}

// Check for duplicate
if (results.some(r => r.matchupId === matchupId)) {
  console.error('ERROR: Result for ' + matchupId + ' already exists. Remove it first to update.');
  process.exit(1);
}

// Determine seed pairing for upset detection
const SEED_PAIRS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]];
const round = parseInt(matchupId.split('-')[0].slice(1));
const region = matchupId.split('-')[1];
const slot = parseInt(matchupId.split('-')[2]);

let annotation = '';
if (round === 1) {
  const pair = SEED_PAIRS[slot - 1];
  if (pair) {
    const favSeed = Math.min(...pair);
    const dogSeed = Math.max(...pair);
    const seedDiff = Math.abs(winner.seed - (winner.seed === favSeed ? dogSeed : favSeed));
    if (winner.seed > favSeed) {
      annotation = ' UPSET ' + winner.seed + ' over ' + favSeed + ' (diff: ' + seedDiff + ')';
    } else {
      annotation = ' chalk (' + favSeed + ' seed)';
    }
  }
} else {
  annotation = ' (R' + round + ')';
}

// Append result
results.push({ matchupId, winnerId, status: 'final' });
results.sort((a, b) => {
  const ra = parseInt(a.matchupId.split('-')[0].slice(1));
  const rb = parseInt(b.matchupId.split('-')[0].slice(1));
  if (ra !== rb) return ra - rb;
  return a.matchupId.localeCompare(b.matchupId);
});

fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2) + '\n');
console.log('Added: ' + matchupId + ' → ' + winner.team + ' (' + winnerId + ')' + annotation);

// Also update out/data/ if exists
const outFile = resultsFile.replace('/public/', '/out/');
if (fs.existsSync(require('path').dirname(outFile))) {
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n');
}

console.log('Total results: ' + results.length + '/63');
"
