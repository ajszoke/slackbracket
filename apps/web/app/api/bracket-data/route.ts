import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bracket = url.searchParams.get("bracket") === "women" ? "women" : "men";
  const filename = bracket === "women" ? "demo_bracket_full_women.json" : "demo_bracket_full.json";
  const fullPath = path.resolve(process.cwd(), "../../slackbracket-react/public/data", filename);

  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: "Unable to load bracket data" }, { status: 500 });
  }
}
