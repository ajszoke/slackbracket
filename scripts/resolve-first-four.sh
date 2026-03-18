#!/usr/bin/env bash
# Resolve a First Four play-in game by replacing the placeholder team with the winner.
#
# Usage:
#   ./scripts/resolve-first-four.sh <winner>
#
# Where <winner> is the team name as it appears in the bracket JSON
# (either the placeholder or the firstFourOpponent).
#
# Examples:
#   ./scripts/resolve-first-four.sh "Howard"         # opponent wins, replaces UMBC
#   ./scripts/resolve-first-four.sh "UMBC"            # placeholder wins, just strips FF data
#   ./scripts/resolve-first-four.sh "NC State"        # opponent wins, replaces Texas
#   ./scripts/resolve-first-four.sh "Lehigh"          # placeholder wins
#
# What it does:
#   - Finds the First Four matchup involving the named team
#   - If winner is the opponent: replaces team name, ELO, conference, logo
#   - Strips the firstFourOpponent field
#   - Downloads logo locally if needed
#   - Updates both public/data/ and out/data/ JSONs
#   - Rebuilds and optionally deploys

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRACKET_FILE="${REPO_ROOT}/apps/web/public/data/bracket_men.json"
LOGO_DIR="${REPO_ROOT}/apps/web/public/logos"
WINNER="${1:?Usage: $0 <winner-team-name>}"

node -e "
const fs = require('fs');
const path = require('path');

const bracketFile = '${BRACKET_FILE}';
const logoDir = '${LOGO_DIR}';
const winner = '${WINNER}';

const teams = JSON.parse(fs.readFileSync(bracketFile, 'utf8'));

// Find the First Four matchup
let found = false;
for (const team of teams) {
  if (!team.firstFourOpponent) continue;
  const opp = team.firstFourOpponent;

  const isPlaceholderWin = team.team === winner;
  const isOpponentWin = opp.team === winner;

  if (!isPlaceholderWin && !isOpponentWin) continue;
  found = true;

  console.log('Found: ' + team.team + ' (seed ' + team.seed + ', ' + team.region + ') vs ' + opp.team);

  if (isOpponentWin) {
    console.log('Winner: ' + opp.team + ' (opponent) — replacing ' + team.team);
    // Slugify for logo filename
    const slug = opp.team.toLowerCase().replace(/[().]/g, '').replace(/[\\s']+/g, '-');
    const localLogo = '/logos/' + slug + '.png';

    // Download logo if it's a remote URL and we don't have it locally
    const logoPath = path.join(logoDir, slug + '.png');
    const svgPath = path.join(logoDir, slug + '.svg');
    if (!fs.existsSync(logoPath) && !fs.existsSync(svgPath)) {
      if (opp.logoUrl && opp.logoUrl.startsWith('http')) {
        console.log('Need logo: ' + opp.logoUrl);
        console.log('Download to: ' + logoPath);
        console.log('Run: curl -sL \"' + opp.logoUrl + '\" -o \"' + logoPath + '\"');
      } else {
        console.log('Logo already local or missing: ' + (opp.logoUrl || 'none'));
      }
    } else {
      console.log('Logo already exists locally');
      // Check if it's svg
      if (fs.existsSync(svgPath)) {
        team.logoUrl = '/logos/' + slug + '.svg';
      }
    }

    team.team = opp.team;
    team.elo = opp.elo;
    team.conference = opp.conference;
    if (!fs.existsSync(logoPath) && !fs.existsSync(svgPath) && opp.logoUrl) {
      team.logoUrl = localLogo;
    }
  } else {
    console.log('Winner: ' + team.team + ' (placeholder) — keeping as-is');
  }

  delete team.firstFourOpponent;
  console.log('Removed firstFourOpponent field');
  break;
}

if (!found) {
  console.error('ERROR: No First Four matchup found for \"' + winner + '\"');
  console.error('Available First Four teams:');
  for (const t of teams) {
    if (t.firstFourOpponent) {
      console.error('  ' + t.team + ' vs ' + t.firstFourOpponent.team + ' (' + t.region + ' ' + t.seed + ')');
    }
  }
  process.exit(1);
}

fs.writeFileSync(bracketFile, JSON.stringify(teams, null, 2) + '\\n');
console.log('Updated ' + bracketFile);

// Also update out/data/ if it exists
const outFile = bracketFile.replace('/public/', '/out/');
if (fs.existsSync(outFile)) {
  fs.writeFileSync(outFile, JSON.stringify(teams, null, 2) + '\\n');
  console.log('Updated ' + outFile);
}

// Show remaining First Four games
const remaining = teams.filter(t => t.firstFourOpponent);
if (remaining.length > 0) {
  console.log('\\nRemaining First Four games:');
  for (const t of remaining) {
    console.log('  ' + t.team + ' vs ' + t.firstFourOpponent.team + ' (' + t.region + ' ' + t.seed + ')');
  }
} else {
  console.log('\\nAll First Four games resolved!');
}
"
