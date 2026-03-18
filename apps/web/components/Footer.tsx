"use client";

import { useCallback, useState } from "react";

const BTC_ADDRESS = "3Nej8eESs213wuowoAcAxYT6wytLH7mUPF";

export function Footer() {
  const [copied, setCopied] = useState(false);

  const copyBtc = useCallback(() => {
    navigator.clipboard.writeText(BTC_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>
          Created by Andy Szoke, 2019–2026. Team strength data from{" "}
          <a href="https://www.natesilver.net/p/cooper-mens-ncaa-basketball-power-ratings" target="_blank" rel="noreferrer">
            Nate Silver&apos;s COOPER ratings
          </a>
          .
        </p>
        <div className="site-footer__links">
          <a href="https://github.com/ajszoke/slackbracket" target="_blank" rel="noreferrer">GitHub</a>
          <a href="mailto:aszoke1@gmail.com">Contact</a>
          <a href="https://www.paypal.me/slackbracket" target="_blank" rel="noreferrer">PayPal</a>
          <span className="site-footer__btc" title={`Bitcoin: ${BTC_ADDRESS}`}>
            BTC: 3Nej...mUPF
            <button
              onClick={copyBtc}
              className="site-footer__copy-btn"
              aria-label="Copy Bitcoin address"
            >
              {copied ? (
                <span className="site-footer__copied">Copied!</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </span>
        </div>
      </div>
    </footer>
  );
}
