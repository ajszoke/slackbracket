"use client";

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

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };
  const nativeShare = async () => {
    if (!navigator.share) return;
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
              >
                Post to X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noreferrer"
                className="btn-muted"
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", textDecoration: "none" }}
              >
                Facebook
              </a>
              <a
                href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${tweet}`}
                target="_blank"
                rel="noreferrer"
                className="btn-muted"
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", textDecoration: "none" }}
              >
                Reddit
              </a>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copy} className="btn-ghost" style={{ fontSize: "0.75rem" }}>
                Copy Link
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
