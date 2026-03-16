"use client";

type Props = {
  shareUrl: string;
  oneIn: string;
};

function buildTweet(url: string, oneInText: string): string {
  return `I built my #MarchMadness bracket on Slackbracket (${oneInText} odds). Try to beat it: ${url}`;
}

export function SocialSharePanel({ shareUrl, oneIn }: Props) {
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const tweet = encodeURIComponent(buildTweet(shareUrl, oneIn));
  const encodedUrl = encodeURIComponent(shareUrl);

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", fontSize: "0.9rem" }}>
          <a href={`https://x.com/intent/tweet?text=${tweet}`} target="_blank" rel="noreferrer">
            X
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">
            Facebook
          </a>
          <a href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${tweet}`} target="_blank" rel="noreferrer">
            Reddit
          </a>
          {canNativeShare ? <button onClick={nativeShare}>Native Share</button> : null}
          <button onClick={copy}>Copy Link</button>
        </div>
        <small style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Mobile uses native share sheet when available.</small>
      </div>
    </section>
  );
}
