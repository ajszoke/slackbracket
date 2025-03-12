from CalculateSchoolVenueDistances import geocode_location
import json
import os

# Get path to the data directory
script_dir = os.path.dirname(os.path.abspath(__file__))
schools_cache = os.path.join(os.path.dirname(script_dir), 'data', 'school_geocodes.json')

# Load existing geocodes
with open(schools_cache, 'r') as f:
    school_geocodes = json.load(f)

corrections = json.load(open(os.path.join(os.path.dirname(script_dir), 'data', 'schoolNameTransforms.json')))

# Re-geocode corrected names
for short_name, correct_name in corrections.items():
    coord = geocode_location(correct_name)
    if coord:
        school_geocodes[short_name] = coord
        print(f"Corrected {short_name} → {coord}")

# Re-save corrected coordinates
with open(schools_cache, 'w') as f:
    json.dump(school_geocodes, f)