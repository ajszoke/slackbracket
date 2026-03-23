/**
 * Compact bracket share encoding (v2).
 *
 * Format: 26 bytes → ~35 chars base64url (vs ~300+ chars in v1 JSON).
 *
 * Byte 0:     0x02 (version)
 * Byte 1:     metadata — bit 7: bracketType (0=men,1=women), bits 6-0: chaos×100
 * Bytes 2-17: pick bits — 63 games × 2 bits, padded to 128 bits (16 bytes)
 *             00=no pick, 10=source A, 11=source B, 01=reserved
 * Bytes 18-25: source bits — 63 games × 1 bit, padded to 64 bits (8 bytes)
 *             0=auto, 1=user
 *
 * Games enumerated in buildGameTree() order (deterministic).
 * Decoder replays picks forward: R1 sources are fixed teams, R2+ resolve from prior picks.
 */

import type { GameNode } from "./tournament";

type PickSource = "user" | "auto" | "locked";

// ── Bit helpers ─────────────────────────────────────────────────────

function setBit(buf: Uint8Array, bitIndex: number, value: 0 | 1) {
  const byte = bitIndex >>> 3;
  const bit = 7 - (bitIndex & 7);
  if (value) buf[byte] |= 1 << bit;
}

function getBit(buf: Uint8Array, bitIndex: number): 0 | 1 {
  const byte = bitIndex >>> 3;
  const bit = 7 - (bitIndex & 7);
  return ((buf[byte] >>> bit) & 1) as 0 | 1;
}

// ── Base64-URL ──────────────────────────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Resolve which team occupies a game source slot ──────────────────

function resolveSourceTeam(
  source: GameNode["sourceA"],
  picks: Record<string, string>
): string | null {
  if (source.type === "team") return source.teamId;
  return picks[source.matchupId] ?? null;
}

// ── Encode ──────────────────────────────────────────────────────────

export function encodeCompact(
  picks: Record<string, string>,
  sources: Record<string, PickSource>,
  games: GameNode[],
  bracketType: "men" | "women",
  chaos: number
): string {
  const buf = new Uint8Array(26);

  // Version
  buf[0] = 0x02;

  // Metadata
  buf[1] = ((bracketType === "women" ? 1 : 0) << 7) | (Math.round(chaos * 100) & 0x7f);

  // Pick bits (2 bits per game, starting at byte 2 = bit 16)
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const picked = picks[game.id];
    if (!picked) continue; // 00 = no pick (default zeros)

    const teamA = resolveSourceTeam(game.sourceA, picks);
    const teamB = resolveSourceTeam(game.sourceB, picks);
    const bitBase = 16 + i * 2; // offset past 2 header bytes

    // High bit = "has pick" (1), low bit = "which source" (0=A, 1=B)
    setBit(buf, bitBase, 1);
    if (picked === teamB) {
      setBit(buf, bitBase + 1, 1);
    } else if (picked !== teamA) {
      // Team doesn't match either source — shouldn't happen, but encode as A
      setBit(buf, bitBase + 1, 0);
    }
  }

  // Source bits (1 bit per game, starting at byte 18 = bit 144)
  for (let i = 0; i < games.length; i++) {
    if (sources[games[i].id] === "user") {
      setBit(buf, 144 + i, 1);
    }
  }

  return toBase64Url(buf);
}

// ── Decode ──────────────────────────────────────────────────────────

export function decodeCompact(
  encoded: string,
  games: GameNode[]
): {
  picks: Record<string, string>;
  sources: Record<string, PickSource>;
  bracketType: "men" | "women";
  chaos: number;
} | null {
  let buf: Uint8Array;
  try {
    buf = fromBase64Url(encoded);
  } catch {
    return null;
  }
  if (buf.length < 26 || buf[0] !== 0x02) return null;

  const bracketType = (buf[1] & 0x80) ? "women" : "men";
  const chaos = (buf[1] & 0x7f) / 100;

  const picks: Record<string, string> = {};
  const sources: Record<string, PickSource> = {};

  // Decode picks in order — later rounds resolve from earlier picks
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const bitBase = 16 + i * 2;
    const hasPick = getBit(buf, bitBase);
    if (!hasPick) continue;

    const pickB = getBit(buf, bitBase + 1);
    const source = pickB ? game.sourceB : game.sourceA;
    const teamId = resolveSourceTeam(source, picks);
    if (!teamId) continue; // upstream pick missing — skip

    picks[game.id] = teamId;
    sources[game.id] = getBit(buf, 144 + i) ? "user" : "auto";
  }

  return { picks, sources, bracketType, chaos };
}

// ── Version detection ───────────────────────────────────────────────

export function isCompactPayload(encoded: string): boolean {
  try {
    const buf = fromBase64Url(encoded);
    return buf.length >= 26 && buf[0] === 0x02;
  } catch {
    return false;
  }
}
