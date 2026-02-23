import type { Team } from "@slackbracket/domain";
import { teamSchema } from "@slackbracket/domain";

export type GameSource =
  | { type: "team"; teamId: string }
  | { type: "winner"; matchupId: string };

export type GameNode = {
  id: string;
  round: number;
  region: "East" | "West" | "South" | "Midwest" | "FinalFour";
  slot: number;
  sourceA: GameSource;
  sourceB: GameSource;
};

const ROUND1_SEED_PAIRS: Array<[number, number]> = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15]
];

const REGIONS: Array<"East" | "West" | "South" | "Midwest"> = ["East", "West", "South", "Midwest"];

export function normalizeTeams(rawTeams: unknown[]): Team[] {
  return rawTeams.map((team) => {
    const cast = team as Record<string, unknown>;
    const id = `${cast.region}-${cast.seed}-${cast.team}`
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll(".", "")
      .replaceAll("'", "");
    return teamSchema.parse({
      ...cast,
      id
    });
  });
}

function gameId(round: number, region: string, slot: number): string {
  return `R${round}-${region}-${slot}`;
}

export function buildGameTree(teams: Team[]): GameNode[] {
  const nodes: GameNode[] = [];
  const byRegion = new Map<string, Team[]>();

  for (const region of REGIONS) {
    byRegion.set(
      region,
      teams
        .filter((team) => team.region === region)
        .sort((a, b) => a.seed - b.seed)
    );
  }

  for (const region of REGIONS) {
    const regionTeams = byRegion.get(region) ?? [];
    const bySeed = new Map(regionTeams.map((team) => [team.seed, team]));

    ROUND1_SEED_PAIRS.forEach(([seedA, seedB], index) => {
      const teamA = bySeed.get(seedA);
      const teamB = bySeed.get(seedB);
      if (!teamA || !teamB) return;
      nodes.push({
        id: gameId(1, region, index + 1),
        round: 1,
        region,
        slot: index + 1,
        sourceA: { type: "team", teamId: teamA.id },
        sourceB: { type: "team", teamId: teamB.id }
      });
    });

    for (let round = 2; round <= 4; round++) {
      const gamesInRound = 8 / Math.pow(2, round - 1);
      for (let slot = 1; slot <= gamesInRound; slot++) {
        const sourceSlotA = slot * 2 - 1;
        const sourceSlotB = slot * 2;
        nodes.push({
          id: gameId(round, region, slot),
          round,
          region,
          slot,
          sourceA: { type: "winner", matchupId: gameId(round - 1, region, sourceSlotA) },
          sourceB: { type: "winner", matchupId: gameId(round - 1, region, sourceSlotB) }
        });
      }
    }
  }

  nodes.push({
    id: gameId(5, "FinalFour", 1),
    round: 5,
    region: "FinalFour",
    slot: 1,
    sourceA: { type: "winner", matchupId: gameId(4, "East", 1) },
    sourceB: { type: "winner", matchupId: gameId(4, "West", 1) }
  });
  nodes.push({
    id: gameId(5, "FinalFour", 2),
    round: 5,
    region: "FinalFour",
    slot: 2,
    sourceA: { type: "winner", matchupId: gameId(4, "South", 1) },
    sourceB: { type: "winner", matchupId: gameId(4, "Midwest", 1) }
  });
  nodes.push({
    id: gameId(6, "FinalFour", 1),
    round: 6,
    region: "FinalFour",
    slot: 1,
    sourceA: { type: "winner", matchupId: gameId(5, "FinalFour", 1) },
    sourceB: { type: "winner", matchupId: gameId(5, "FinalFour", 2) }
  });

  return nodes;
}

export function resolveTeamForSource(
  source: GameSource,
  picksByMatchup: Record<string, string>,
  teamsById: Record<string, Team>
): Team | null {
  if (source.type === "team") {
    return teamsById[source.teamId] ?? null;
  }
  const pickedId = picksByMatchup[source.matchupId];
  return pickedId ? (teamsById[pickedId] ?? null) : null;
}
