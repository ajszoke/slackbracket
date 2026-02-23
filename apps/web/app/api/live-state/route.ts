import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder live feed format. In production, map provider game IDs
  // to Slackbracket matchup IDs and return real statuses.
  return NextResponse.json({
    updatedAt: Date.now(),
    results: [] as Array<{ matchupId: string; winnerId: string; status: "live" | "final" }>
  });
}
