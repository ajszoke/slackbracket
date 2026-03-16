"use client";

import type { Team } from "@slackbracket/domain";
import { useEffect, useState } from "react";

import { deterministicColor, fetchLogoForTeam, teamInitials } from "../lib/logos";

function SplitHalf({
  label,
  logoUrl,
  color,
  clipPath,
  offset,
}: {
  label: string;
  logoUrl: string | null;
  color: string;
  clipPath: string;
  offset: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: logoUrl ? undefined : `linear-gradient(135deg, ${color}, #111827)`,
        clipPath,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={label}
          width={28}
          height={28}
          style={{ transform: `translate(${offset})`, objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", transform: `translate(${offset})` }}>
          {teamInitials(label)}
        </span>
      )}
    </div>
  );
}

function SplitBadge({ team }: { team: Team }) {
  const opp = team.firstFourOpponent!;
  const colorA = deterministicColor(team.id);
  const colorB = deterministicColor(`${team.region}-${team.seed}-${opp.team}`);

  // Fetch logos for both teams (ready for NCAA API sweep)
  const [logoA, setLogoA] = useState<string | null>(team.logoUrl ?? null);
  const [logoB, setLogoB] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!logoA) {
      fetchLogoForTeam(team).then((url) => { if (mounted) setLogoA(url); });
    }
    fetchLogoForTeam({ ...team, team: opp.team } as Team).then((url) => {
      if (mounted) setLogoB(url);
    });
    return () => { mounted = false; };
  }, [team, opp.team, logoA]);

  return (
    <div
      title={`${team.team} / ${opp.team}`}
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <SplitHalf
        label={team.team}
        logoUrl={logoA}
        color={colorA}
        clipPath="polygon(0 0, 100% 0, 0 100%)"
        offset="-2px, -2px"
      />
      <SplitHalf
        label={opp.team}
        logoUrl={logoB}
        color={colorB}
        clipPath="polygon(100% 0, 100% 100%, 0 100%)"
        offset="2px, 2px"
      />
      {/* Diagonal divider line */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(255,255,255,0.4) 50%, transparent calc(50% + 0.5px))",
        }}
      />
    </div>
  );
}

function StandardBadge({ team }: { team: Team }) {
  const [logo, setLogo] = useState<string | null>(team.logoUrl ?? null);
  const [currentTeamId, setCurrentTeamId] = useState(team.id);

  // React 19 pattern: reset state during render when team prop changes
  if (team.id !== currentTeamId) {
    setCurrentTeamId(team.id);
    setLogo(team.logoUrl ?? null);
  }

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

export function TeamBadge({ team }: { team: Team }) {
  return team.firstFourOpponent ? <SplitBadge team={team} /> : <StandardBadge team={team} />;
}
