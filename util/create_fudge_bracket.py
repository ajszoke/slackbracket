import pandas as pd
import json
import random
import os

# Load Elo CSV data
script_dir = os.path.dirname(os.path.abspath(__file__))
elo_csv_path = os.path.join(script_dir, '../data/data-nO2M0.csv')   
elo_df = pd.read_csv(elo_csv_path)

# Keep top 64 teams by Elo
elo_df = elo_df.sort_values(by='Current Elo', ascending=False).head(64).reset_index(drop=True)

# Regions for seeding
regions = ['East', 'West', 'Midwest', 'South']

# Assign seeds systematically
teams_with_seeds = []
teams = []
bracket = []

# Assign seeds systematically
for seed in range(1, 17):  # Seeds 1 through 16
    teams_for_seed = elo_df.iloc[(seed-1)*4 : seed*4].copy()
    random.shuffle(regions)  # shuffle regions assignment per seed for some randomness
    for i, region in enumerate(regions):
        # Simplify the index logic
        idx = i % len(teams_for_seed)
        team_row = teams_for_seed.iloc[idx]
        bracket.append({
            "team": team_row['Team'],
            "region": regions[i % 4],
            "seed": seed,
            "elo": team_row['Current Elo'],
            "conference": team_row['Conf.'],
            "homeCourt": team_row['Home Court*']
        })

# Save to JSON
demo_json_path = os.path.join(script_dir, '../data/demo_bracket.json')
with open(demo_json_path, 'w') as f:
    json.dump(bracket, f, indent=2)

print("Demo bracket created successfully at:", demo_json_path)