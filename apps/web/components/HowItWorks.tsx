"use client";

import "katex/dist/katex.min.css";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// ============================================
// TIER CONTENT
// ============================================

const CONTENT_ELI5 = `
# How Does Slackbracket Work?

Imagine every team has a strength number.

- Bigger number = stronger team
- Smaller number = weaker team
- If a strong team beats a weak team, that is normal
- If a weak team beats a strong team, that is surprising

But here is the important part:

**We do not measure surprise by seed number alone.**
We measure surprise by **how likely the picked team was to win**.

Why?

Because some "upsets" are not really that shocking.
A 9-seed beating an 8-seed might barely be an upset at all.
Meanwhile, a tiny underdog beating a giant favorite is a huge shock.

So Slackbracket thinks about picks like this:

- A team with a 50% chance to win: not very surprising
- A team with a 25% chance to win: pretty surprising
- A team with a 10% chance to win: very surprising
- A team with a 1% chance to win: absolute bedlam

That gives us a much better answer to:
**"How wild are these picks, really?"**

## Why This Matters

Suppose someone picks a few underdogs.

That does **not** automatically mean they are being reckless.

Underdogs win all the time.
That is part of sports.
A good surprise meter should know the difference between:

- "yeah, that happens"
- "okay, bold"
- "what the hell are you cooking"

## The Simple Idea

For each picked game, ask:

> How likely was this winner according to the ratings?

Then:

- likely pick -> low surprise
- unlikely pick -> high surprise

Add those game surprises together, and you get the bracket's overall surprise level.

## Why "Chaos" Is Separate

In Slackbracket, **chaos** is the fun, human-facing vibe.
It is the flavor text, the color, the sense that someone is going full goblin mode.

But underneath that, the real engine is **surprise**:
a math-based measure of how unlikely the picks were.

So:

- **surprise** = the measurement
- **chaos** = the mood

## One Neat Thing From This Year's Data

In the 2026 files, the women's top teams are much farther above the middle of the pack than the men's top teams.

Very roughly:

- Men's top team: Duke at **2256**
- Men's median team: about **1477**
- Women's top team: UConn at **2690**
- Women's median team: about **1455**

So the women's bracket has some truly enormous favorites at the top.
That means the same-looking "upset" can be a very different level of shock in the men's and women's tournaments.

## Grandma Version

Think of it like weather.

- If the forecast says **50% chance of rain** and it rains, that is ordinary.
- If the forecast says **2% chance of rain** and it pours, that is a surprise.

A bracket pick works the same way.

We are not asking:
**"Did the smaller seed win?"**

We are asking:
**"How surprised should we be, given what the ratings believed before the game?"**
`;

const CONTENT_DETAILS = `
## 1. Start With a Win Probability

For every game, your rating model gives the picked team some probability to win.

Call that probability $p$.

Examples:

- if the teams are even, maybe $p = 0.50$
- if your pick is a mild underdog, maybe $p = 0.40$
- if your pick is a real longshot, maybe $p = 0.10$

## 2. Convert That Probability Into Surprise

We measure surprise with:

$$\\text{surprisal} = -\\log_2(p)$$

This has a nice interpretation in **bits**.

Examples:

- $p = 0.50 \\Rightarrow 1.00$ bits
- $p = 0.40 \\Rightarrow 1.32$ bits
- $p = 0.25 \\Rightarrow 2.00$ bits
- $p = 0.10 \\Rightarrow 3.32$ bits
- $p = 0.01 \\Rightarrow 6.64$ bits

So lower-probability picks grow more surprising very quickly.

## 3. Why This Is Better Than Counting Seed Upsets

A seed upset and a rating upset are not the same thing.

Examples:

- An 8-seed vs 9-seed may be almost a coin flip
- A 12-seed might actually rate close to a 5-seed
- A 1-seed crushing a 16-seed is extremely expected
- A 16-seed beating a true powerhouse is an enormous surprise

That is why a serious bracket engine should be based on **rating probabilities**, not just seed labels.

## 4. How To Score a Whole Set of Picks

If a side picks games $g = 1,2,\\dots,n$, then total surprise can start as:

$$S = \\sum_g -\\log_2(p_g)$$

But raw totals are not enough, because:

- more picks always make the total bigger
- early rounds have many more games than late rounds
- one giant title-game upset can get drowned by lots of boring first-round games

## 5. The Better Version: Compare Against Expectation

For each game, the model itself tells us what "normal" looks like.

If the picked team has win probability $p_g$, then the expected surprisal for that game is the binary entropy:

$$\\mu_g = -p_g \\log_2(p_g) - (1-p_g)\\log_2(1-p_g)$$

So the question becomes:

> Was this set of picks more surprising than a normal rating-driven picker would usually be over these same games?

That is the right baseline.

## 6. Round Weighting

For bracket feel, it is often better to weight rounds equally.

If:

- $K$ = number of rounds with picked games
- $n_r$ = number of picked games in round $r$

then a clean weight is:

$$w_g = \\frac{1}{K n_r}$$

for every game $g$ in round $r$.

Then:

$$T = \\sum_g w_g \\cdot \\left(-\\log_2(p_g)\\right)$$

This means:

- the whole first round counts like one chapter
- the whole title game round counts like one chapter
- late-round shocks matter appropriately

## 7. Standardize It With a Z-Score

Let

$$E[T] = \\sum_g w_g \\mu_g$$

and

$$\\mathrm{Var}(T) = \\sum_g w_g^2 \\sigma_g^2$$

where $\\sigma_g^2$ is the variance of surprisal for game $g$.

Then define:

$$z = \\frac{T - E[T]}{\\sqrt{\\mathrm{Var}(T)}}$$

Interpretation:

- $z \\approx 0$: normal level of surprise
- $z < 0$: chalkier than expected
- $z > 0$: spicier than expected
- large positive $z$: genuinely wild bracket behavior

## 8. Why This Fits Slackbracket

This gives a clean split:

- **Seed-chaos** can stay cosmetic
- **ELO surprise** becomes the real statistical engine

So the user orb and AI orb can each answer:

> How much more upset-heavy or chalk-heavy were this side's picks than a rating-based picker would normally be?

## 9. What the 2026 ELO Files Suggest

The current data says the women's landscape is more top-heavy than the men's.

From the uploaded files:

- Men: standard deviation of ELO is about **258**
- Women: standard deviation of ELO is about **344**
- Men: top team minus median is about **779**
- Women: top team minus median is about **1235**

That means top women's teams sit much farther above the field.

So in practical terms:

- giant women's favorites are often **more giant**
- a "normal" upset profile in the women's bracket is not the same as a normal upset profile in the men's bracket

That is exactly why the surprise engine should be probability-based and model-relative.

## 10. Where Nate's COOPER Model Fits In

At a medium-detail level, COOPER is basically a more advanced rating engine that tries to turn basketball results into realistic win probabilities.

Broadly speaking, it uses:

- wins and losses
- margin of victory
- opponent strength
- pace
- preseason expert information
- conference strength
- extra weight for more informative games

Then Nate's tournament forecast adds more layers, including:

- injuries
- travel
- "hot" tournament updating
- a blend with KenPom on the men's side and Her Hoop Stats on the women's side

For Slackbracket, the key design lesson is this:

**Whatever forward model you use to generate win probabilities, compute surprisal from that same model.**
`;

const CONTENT_WHITEPAPER = `
# Whitepaper: Model-Relative Surprisal and Chaos in Bracket Completion

## Abstract

We distinguish between two concepts that are often conflated in bracket products:

1. **Seed chaos** — a cosmetic or narrative notion of bracket weirdness, often driven by seed-line upsets.
2. **Model-relative surprise** — a quantitative notion of how unlikely a chosen set of winners is under a specified predictive model.

This paper argues that bracket "surprise" should be computed relative to the same forward probability model used to evaluate games, rather than inferred from seed differences or raw upset counts. The recommended metric is a **round-aware standardized surprisal score** based on the chosen winner's probability in each picked game. The result is interpretable across partial brackets, robust to natural underdog variance, and compatible with separate user and AI pick streams.

Using the 2026 men's and women's ELO snapshots, we show that the two tournaments inhabit meaningfully different strength landscapes. The women's field is substantially more top-heavy: the women's top team (UConn, 2690.0) sits much farther above the median team (1455.3) than the men's top team (Duke, 2256.2) sits above the men's median (1477.0). Consequently, a seed-labeled upset need not imply the same level of statistical surprise across the two tournaments. This motivates a probability-native surprise engine rather than a seed-native one.

---

## 1. Data Snapshot

The following observations come from the 2026 ELO files.

| Metric | Men | Women |
|---|---:|---:|
| Teams | 365 | 363 |
| Top team | Duke | UConn |
| Top ELO | 2256.2 | 2690.0 |
| Median ELO | 1477.0 | 1455.3 |
| ELO standard deviation | 258.0 | 343.8 |
| Top team minus median | 779.2 | 1234.7 |
| Top-16 average ELO | 2098.4 | 2333.1 |
| Rank-16 ELO | 2000.1 | 2191.4 |
| Top team minus rank-16 | 256.2 | 498.6 |

Two immediate implications follow:

- The women's ratings have a **wider spread**, especially at the top.
- The men's field is **flatter**, so more games near the upper-middle tier are relatively live.

---

## 2. Visual Context

### ELO by Rank
![2026 COOPER ELO by Rank](/charts/elo_rank_curves.png)

### Top-16 Strength Curve
![Top-16 Strength Curve](/charts/top16_strength_curve.png)

### Surprisal Curve
![How Fast Surprise Grows as Picks Get Wilder](/charts/surprisal_curve.png)

---

## 3. Definitions

Let $G$ denote the set of games explicitly chosen by one actor, such as the user or the AI.

For each chosen game $g \\in G$:

- let $p_g \\in (0,1)$ be the model-implied win probability of the **chosen winner**
- let $r(g)$ denote the round of game $g$

We define the **surprisal** of a picked winner as

$$i_g = -\\log_2(p_g).$$

This quantity is measured in bits.

Examples:

- $p=0.50 \\Rightarrow 1.00$ bits
- $p=0.25 \\Rightarrow 2.00$ bits
- $p=0.10 \\Rightarrow 3.32$ bits
- $p=0.01 \\Rightarrow 6.64$ bits

Thus, surprise rises nonlinearly as picks get less likely.

---

## 4. Why Raw Upset Counts Fail

A raw seed-upset count treats all upsets as comparable. A raw ELO-loss total treats all underdog selections as evidence of chaos. Both fail in practice.

The central problem is that sports models expect some underdog wins. A 40/60 game producing the 40% side is not pathological. Counting that the same way as a 1% miracle win is a calibration error.

Therefore, the correct question is not:

> "How many underdogs were picked?"

but rather:

> "How much more surprising was this pick set than a normal model-driven picker would be over the same games?"

---

## 5. Null Model and Expected Surprise

For each game $g$, the model itself induces a null distribution over outcomes. If the chosen team has probability $p_g$, then the expected surprisal for that game is the binary entropy:

$$\\mu_g = -p_g \\log_2(p_g) - (1-p_g)\\log_2(1-p_g).$$

The per-game surprisal variance is

$$\\sigma_g^2 = p_g \\left(-\\log_2 p_g - \\mu_g\\right)^2 + (1-p_g)\\left(-\\log_2(1-p_g) - \\mu_g\\right)^2.$$

This gives the appropriate baseline for the question:
how unusual was the selected winner relative to what the model normally expects?

---

## 6. Round-Aware Aggregate Surprise

A plain sum,

$$S_{\\text{raw}} = \\sum_{g \\in G} i_g,$$

is not ideal for bracket feel, because early rounds contain many more games than later rounds. A giant title-game shock can be visually and narratively drowned by lots of mundane first-round chalk.

To solve this, define:

- $K$ = number of rounds with at least one chosen game
- $n_r$ = number of chosen games in round $r$

For game $g$ in round $r$, assign weight

$$w_g = \\frac{1}{K n_r}.$$

This makes each represented round contribute equally in aggregate.

Now define the round-aware surprise statistic

$$T = \\sum_{g \\in G} w_g i_g.$$

Its expectation is

$$\\mathbb{E}[T] = \\sum_{g \\in G} w_g \\mu_g,$$

and its variance is

$$\\mathrm{Var}(T) = \\sum_{g \\in G} w_g^2 \\sigma_g^2.$$

The standardized surprise score is

$$z = \\frac{T - \\mathbb{E}[T]}{\\sqrt{\\mathrm{Var}(T)}}.$$

Interpretation:

- $z \\approx 0$: normal model-consistent surprise
- $z < 0$: chalkier than expected
- $z > 0$: spicier than expected
- large positive $z$: genuinely wild outcome selection

---

## 7. Percentile and Heat Mappings

A convenient semantic mapping is

$$u = \\Phi(z),$$

where $\\Phi$ is the standard normal CDF.

Then:

- $u \\approx 0.50$: neutral / true-odds behavior
- $u \\ll 0.50$: chalk-heavy
- $u \\gg 0.50$: upset-heavy

A one-sided visual "heat" scalar can be derived as

$$h = \\max(0, 2u - 1).$$

This is useful for fiery visuals, but it should **not** replace the centered score when labels need to distinguish chalk, neutral, and spicy. That distinction belongs to $z$ or $u$, not to one-sided heat.

---

## 8. Confidence and Effective Sample Size

Low pick counts create legitimate uncertainty. Two notions of confidence should be separated:

### 8.1 Copy / Coverage Confidence
A UX notion such as

$$c_{\\text{coverage}} = \\frac{|G|}{63}$$

works well for tentative phrasing.

### 8.2 Statistical Stability
Under weighted aggregation, a cleaner signal-strength measure is the effective sample size

$$n_{\\text{eff}} = \\frac{1}{\\sum_{g \\in G} w_g^2}.$$

This is more appropriate for animation stability, saturation, or certainty styling.

Thus, a sparse but extreme bracket can be both statistically hot and verbally tentative. That is a feature, not a bug.

---

## 9. Separating "Seed Chaos" from "ELO Surprise"

A well-designed bracket UI should preserve the difference between:

### Seed Chaos
- based on seed-line drama
- great for flames, badges, cosmetic excitement, and sports-fan storytelling

### ELO Surprise
- based on model-implied win probabilities
- the correct quantitative engine for user/AI orbs

This split allows the product to be both fun and honest.

---

## 10. Relation to COOPER

Nate Silver's public COOPER methodology suggests an important modeling lesson:

COOPER is not just a plain seed table or a naive ELO. It is a richer Bayesian, ELO-like system that incorporates:

- outcomes and margin of victory
- opponent strength
- pace
- preseason expert information
- conference strength
- home court and travel
- impact weighting for more informative games
- women-specific parameter choices
- fat-tailed score uncertainty
- tournament-specific hot updating
- injury handling
- blended external systems for final tournament forecasts

However, Slackbracket does **not** need to replicate COOPER exactly to use the surprisal framework correctly.

It only needs one rule:

> Compute surprise from the same forward probability model used to generate and evaluate picks.

So if Slackbracket uses a simpler internal mapping from rating differences to win probabilities, surprisal remains coherent as long as those probabilities are internally consistent.

---

## 11. Design Consequences for Slackbracket

### 11.1 Canonical Statistical Score
Use centered surprise: $z$, or $u = \\Phi(z)$

### 11.2 Visual Intensity
Use one-sided heat: $h = \\max(0, 2u - 1)$

### 11.3 Label Semantics
Drive labels from the centered score, not from one-sided heat.

### 11.4 Confidence Expression
Use coverage or effective sample size to control how confident the wording feels.

### 11.5 User and AI Separation
Compute the entire pipeline independently for user-picked games and AI-picked games. This preserves the intended dual-orb design.

---

## 12. Conclusion

The key philosophical move is simple:
Bracket surprise should be **model-relative**, not seed-relative.

The key mathematical move is also simple:
Convert picked-win probabilities into surprisal, compare that total against its own model-implied expectation, and standardize.

The key product move is to keep this quantitative surprise engine separate from the more theatrical notion of chaos.

That yields a system that:

- respects natural underdog variance
- scales across partial brackets
- handles men's and women's fields appropriately
- supports separate user and AI identity
- feels intuitive to both casual fans and data nerds
`;

// ============================================
// COMPONENT
// ============================================

const TIERS = [
  { label: "ELI5", content: CONTENT_ELI5 },
  { label: "Full Details", content: CONTENT_DETAILS },
  { label: "Whitepaper", content: CONTENT_WHITEPAPER },
];

const TIER_CTA: Record<number, string> = {
  0: "Give me the full details",
  1: "Give me the full whitepaper",
};

export function HowItWorks() {
  const [expanded, setExpanded] = useState(false);
  const [tier, setTier] = useState(0);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleTierUp = useCallback(() => {
    setTier((prev) => Math.min(prev + 1, TIERS.length - 1));
  }, []);

  const handleBackToSimple = useCallback(() => {
    setTier(0);
  }, []);

  return (
    <section className="how-it-works" style={{ maxWidth: 1400, margin: "2rem auto", padding: "0 1rem" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {/* Header — always visible */}
        <button
          onClick={handleToggle}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            background: "transparent",
            border: "none",
            color: "var(--text)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <h3 style={{ margin: 0, fontFamily: "var(--font-hero), system-ui, sans-serif" }}>How It Works</h3>
          <span
            style={{
              fontSize: "1.2rem",
              transition: "transform 0.3s var(--ease-smooth)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              color: "var(--muted)",
            }}
          >
            &#9660;
          </span>
        </button>

        {/* Content — collapsible */}
        {expanded && (
            <div>
              {/* Tier tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 12,
                  marginBottom: 8,
                  borderBottom: "1px solid var(--divider)",
                  paddingBottom: 8,
                }}
              >
                {TIERS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setTier(i)}
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${i === tier ? "var(--accent)" : "var(--glass-border)"}`,
                      background: i === tier ? "color-mix(in srgb, var(--accent) 30%, transparent 70%)" : "var(--glass-bg)",
                      color: "var(--text)",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: i === tier ? 700 : 500,
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Markdown content with tier transitions */}
              <div className="how-it-works__content" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {TIERS[tier].content}
                    </ReactMarkdown>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                  paddingTop: 8,
                  borderTop: "1px solid var(--divider)",
                }}
              >
                {tier > 0 ? (
                  <button className="btn-ghost" onClick={handleBackToSimple}>
                    Back to simple
                  </button>
                ) : (
                  <span />
                )}
                {TIER_CTA[tier] && (
                  <button
                    onClick={handleTierUp}
                    style={{
                      background: "color-mix(in srgb, var(--accent) 25%, transparent 75%)",
                      border: "1px solid var(--accent)",
                      color: "var(--text)",
                      borderRadius: 8,
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {TIER_CTA[tier]} &rarr;
                  </button>
                )}
              </div>
            </div>
        )}
      </div>
    </section>
  );
}
