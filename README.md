# slackbracket: Customized data-driven bracket forecasting

## What is this?
Slack Bracket lets you fill in the parts of your March Madness bracket that you want to fill in, and generates winners for everything else. You can simulate winners for just one matchup, or the entire tournament. Or anything in between.

## Methodology
All data used in the site is provided by [FiveThirtyEight](https://fivethirtyeight.com/features/how-our-march-madness-predictions-work-2). This includes information about each team, including bracket location and a team rating. For every matchup with an un-set winner, those ratings are used to generate a winner. This ensures that there is a statistically likely amount of upsets in the tourney (excluding matchup winners manually chosen by the user), and those upsets will follow a statistically optimal distribution.

## "...but why?"
Mostly because I thought it would be a fun project. Also, I'm sure it makes some kind of statement about the inherent randomness and unpredictability of the tournament or something.

## This website is filled with bugs!
I know, right? You can help out by raising an issue or submitting a PR.
