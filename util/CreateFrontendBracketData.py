import pandas as pd
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
bracket_json_path = os.path.join(script_dir, '../data/demo_bracket_womens.json')
distances_csv_path = os.path.join(script_dir, '../data/school_venue_distances.csv')
elo_csv_path = os.path.join(script_dir, '../data/data-tQGLh.csv')

# Load data sources
demo_bracket = pd.read_json(bracket_json_path)
distances_df = pd.read_csv(distances_csv_path)
elo_df = pd.read_csv(elo_csv_path)

# Integrate distances & Elo clearly into the demo bracket
integrated_bracket = []

for _, row in demo_bracket.iterrows():
    team_name = row['team']

    # Fetch distances for the team
    team_distances_df = distances_df[distances_df['School'] == team_name]
    distances = {
        row['Venue']: row['Distance_Miles']
        for _, row in distances_df[distances_df['School'] == team_name].iterrows()
    }

    # Get updated Elo/homeCourt from CSV
    elo_info = elo_df[elo_df['Team'] == team_name].iloc[0]

    integrated_team = {
        "team": team_name,
        "region": row['region'],
        "seed": row['seed'],
        "elo": elo_info['Current Elo'],
        "conference": elo_info['Conf.'],
        "homeCourt": elo_info['Home Court*'],
        "distances": distances
    }
    integrated_bracket.append(integrated_team)

# Export fully integrated JSON
output_path = os.path.join(script_dir, '../data/demo_bracket_full_women.json')
with open(output_path, 'w') as f:
    json.dump(integrated_bracket, f, indent=2)

print("Integrated bracket data created at:", output_path)