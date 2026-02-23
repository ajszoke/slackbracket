const VERSION = "v1";

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const b64 = bytesToBase64(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const padded = `${input}${"=".repeat((4 - (input.length % 4)) % 4)}`;
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = base64ToBytes(b64);
  return new TextDecoder().decode(bytes);
}

export function encodeSharePayload(payload: object): string {
  const json = JSON.stringify({ v: VERSION, payload });
  return toBase64Url(json);
}

export function decodeSharePayload<T>(encoded: string): T | null {
  try {
    const decoded = fromBase64Url(encoded);
    const parsed = JSON.parse(decoded) as { v: string; payload: T };
    if (parsed.v !== VERSION) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}
