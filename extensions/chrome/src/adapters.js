function espnAdapter(payload) {
  // ESPN selectors are expected to change yearly.
  // Keep adapter small and easy to patch during tournament week.
  const picks = Object.entries(payload || {});
  for (const [matchupId, teamId] of picks) {
    const selector = `[data-matchup-id="${matchupId}"][data-team-id="${teamId}"]`;
    const button = document.querySelector(selector);
    if (button instanceof HTMLElement) button.click();
  }
}

function cbsAdapter(payload) {
  const picks = Object.entries(payload || {});
  for (const [matchupId, teamId] of picks) {
    const selector = `[data-game-id="${matchupId}"][data-pick-id="${teamId}"]`;
    const button = document.querySelector(selector);
    if (button instanceof HTMLElement) button.click();
  }
}

export function applyPicksForSite(payload) {
  const host = location.hostname;
  if (host.includes("espn.com")) return espnAdapter(payload);
  if (host.includes("cbssports.com")) return cbsAdapter(payload);
  throw new Error("No adapter available for this site yet.");
}
