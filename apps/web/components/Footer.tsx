"use client";

export function Footer() {
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
          <span className="site-footer__btc" title="Bitcoin: 3Nej8eESs213wuowoAcAxYT6wytLH7mUPF">
            BTC: 3Nej...mUPF
          </span>
        </div>
      </div>
    </footer>
  );
}
