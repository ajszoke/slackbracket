/**
 * Lightweight telemetry via sendBeacon → AWS API Gateway → Lambda → S3.
 * 0 kB added bundle (browser APIs only). No-op when endpoint not configured.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_TELEMETRY_URL;
let sessionId: string;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("sb:sid") || crypto.randomUUID();
    sessionStorage.setItem("sb:sid", sessionId);
  }
  return sessionId;
}

export function track(event: string, data?: Record<string, string | number | boolean>) {
  if (!ENDPOINT || typeof navigator === "undefined" || !navigator.sendBeacon) return;

  const payload = JSON.stringify({
    event,
    ...data,
    sessionId: getSessionId(),
    url: location.pathname + location.search,
    referrer: document.referrer || undefined,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ts: Date.now(),
  });

  navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "text/plain" }));
}
