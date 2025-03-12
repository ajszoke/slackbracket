import pandas as pd
import json
import os

# Paths
script_dir = os.path.dirname(os.path.abspath(__file__))
elo_csv_path = os.path.join(script_dir, '../data/data-nO2m0.csv')
dist_csv_path = os.path.join(script_dir, '../data/school_venue_distances.csv')
output_json_path = os.path.join(script_dir, '../data/schools_with_distances.json')

# Load Elo data
elo_df = pd.read_csv(elo_csv_path)

# Load Distance data
dist_df = pd.read_csv(dist_csv_path)

# Building JSON structure
schools_data = {}

for _, row in elo_df.iterrows():
    school_name = row['Team']
    school_entry = {
        "elo": row['Current Elo'],
        "conference": row['Conf.'],
        "homeCourt": row['Home Court*'],
        "distances": {}
    }

    # Matching distances
    distances = dist_df[dist_df['School'] == row['Team']]
    for _, dist_row in distances.iterrows():
        venue = dist_row['Venue']
        distance = dist_row['Distance_Miles']
        school_entry['distances'][venue] = distance

    schools_data[row['Team']] = school_entry

# Write JSON
with open(output_json_path, 'w') as f:
    json.dump(schools_data, f, indent=2)

print("JSON Data file created at:", output_json_path)