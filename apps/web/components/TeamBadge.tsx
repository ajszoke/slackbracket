"use client";

import type { Team } from "@slackbracket/domain";
import { useEffect, useState } from "react";

import { deterministicColor, fetchLogoForTeam, teamInitials } from "../lib/logos";

export function TeamBadge({ team }: { team: Team }) {
  const [logo, setLogo] = useState<string | null>(team.logoUrl ?? null);

  useEffect(() => {
    let mounted = true;
    if (logo) return;
    fetchLogoForTeam(team).then((next) => {
      if (mounted) setLogo(next);
    });
    return () => {
      mounted = false;
    };
  }, [team, logo]);

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={`${team.team} logo`} width={28} height={28} style={{ borderRadius: 999 }} />;
  }

  const color = deterministicColor(team.id);
  return (
    <div
      title={`${team.team} placeholder badge`}
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 800,
        color: "#fff",
        background: `linear-gradient(135deg, ${color}, #111827)`
      }}
    >
      {teamInitials(team.team)}
    </div>
  );
}
