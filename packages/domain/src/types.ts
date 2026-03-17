import { z } from "zod";

export const regionSchema = z.enum(["East", "West", "South", "Midwest", "FinalFour"]);
export type Region = z.infer<typeof regionSchema>;

export const firstFourOpponentSchema = z.object({
  team: z.string(),
  elo: z.number(),
  conference: z.string(),
  logoUrl: z.string().optional()
});

export const teamSchema = z.object({
  id: z.string(),
  team: z.string(),
  shortName: z.string().optional(),
  conference: z.string(),
  region: regionSchema,
  seed: z.number().int().min(1).max(16),
  elo: z.number(),
  homeCourt: z.number().default(0),
  color: z.string().optional(),
  logoUrl: z.string().optional(),
  firstFourOpponent: firstFourOpponentSchema.optional()
});
export type Team = z.infer<typeof teamSchema>;

export const matchupSchema = z.object({
  id: z.string(),
  round: z.number().int().min(1).max(6),
  region: z.string(),
  teamAId: z.string().nullable(),
  teamBId: z.string().nullable(),
  lockedWinnerId: z.string().nullable().default(null),
  status: z.enum(["upcoming", "live", "final"]).default("upcoming")
});
export type Matchup = z.infer<typeof matchupSchema>;

export const bracketStateSchema = z.object({
  bracketType: z.enum(["men", "women"]).default("men"),
  chaos: z.number().min(0).max(1).default(0.5),
  picksByMatchup: z.record(z.string(), z.string()),
  lockedByMatchup: z.record(z.string(), z.string()).default({}),
  updatedAt: z.number().default(() => Date.now())
});
export type BracketState = z.infer<typeof bracketStateSchema>;

export const fullBracketSchema = z.object({
  teams: z.array(teamSchema),
  matchups: z.array(matchupSchema)
});
export type FullBracket = z.infer<typeof fullBracketSchema>;
