"use client";

import { useCallback, useState } from "react";

import { track } from "../lib/telemetry";

type Props = {
  shareUrl: string;
  oneIn: string;
  filled: number;
};

function buildTweet(url: string, oneInText: string): string {
  return `I built my #MarchMadness bracket on Slackbracket (${oneInText} odds). Try to beat it: ${url}`;
}

export function SocialSharePanel({ shareUrl, oneIn, filled }: Props) {
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const tweet = encodeURIComponent(buildTweet(shareUrl, oneIn));
  const encodedUrl = encodeURIComponent(shareUrl);
  const isComplete = filled >= 63;
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    track("share", { method: "copy", filledCount: filled, oneIn });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [shareUrl, filled, oneIn]);

  const nativeShare = async () => {
    if (!navigator.share) return;
    track("share", { method: "native", filledCount: filled, oneIn });
    await navigator.share({ title: "My Slackbracket", text: buildTweet(shareUrl, oneIn), url: shareUrl });
  };

  return (
    <section className="card" style={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
      <h3 style={{ margin: 0, flexShrink: 0 }}>Share + Challenge</h3>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8 }}>
        {isComplete ? (
          <>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.4 }}>
              Your bracket is locked in.<br />
              <span style={{ color: "var(--muted)" }}>Think your friends can do better?</span>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              <a
                href={`https://x.com/intent/tweet?text=${tweet}`}
                target="_blank"
                rel="noreferrer"
                className="btn-active"
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", textDecoration: "none" }}
                onClick={() => track("share", { method: "x", filledCount: filled, oneIn })}
              >
                Post to X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noreferrer"
                className="btn-muted"
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", textDecoration: "none" }}
                onClick={() => track("share", { method: "facebook", filledCount: filled, oneIn })}
              >
                Facebook
              </a>
              <a
                href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${tweet}`}
                target="_blank"
                rel="noreferrer"
                className="btn-muted"
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", textDecoration: "none" }}
                onClick={() => track("share", { method: "reddit", filledCount: filled, oneIn })}
              >
                Reddit
              </a>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copy} className="btn-ghost" style={{ fontSize: "0.75rem", position: "relative" }}>
                {copied ? (
                  <span style={{ color: "var(--good)", fontWeight: 700 }}>Copied!</span>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: -1 }}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
              {canNativeShare && (
                <button onClick={nativeShare} className="btn-ghost" style={{ fontSize: "0.75rem" }}>
                  Share
                </button>
              )}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5 }}>
            Fill your bracket to unlock sharing.<br />
            <span style={{ fontSize: "0.75rem" }}>{filled}/63 picks made</span>
          </p>
        )}
      </div>
    </section>
  );
}
