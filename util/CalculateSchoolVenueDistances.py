import pandas as pd
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import os
import json
import time


script_dir = os.path.dirname(os.path.abspath(__file__))
schools_csv = os.path.join(os.path.dirname(script_dir), 'data', 'data-nO2M0.csv')
venues_csv = os.path.join(os.path.dirname(script_dir), 'data', 'venues_2025.csv')
schools_cache = os.path.join(os.path.dirname(script_dir), 'data', 'school_geocodes.json')
venues_cache = os.path.join(os.path.dirname(script_dir), 'data', 'venue_geocodes.json')

# Initialize geolocator
geolocator = Nominatim(user_agent="slackbracket_geocoder")

# Functions
def geocode_location(name):
    try:
        location = geolocator.geocode(name, timeout=10)
        if location:
            return (location.latitude, location.longitude)
        else:
            print(f"Location '{name}' not found!")
            return None
    except Exception as e:
        print(f"Error '{e}' occurred for location '{name}', retrying...")
        time.sleep(1)
        return geocode_location(name)

def haversine_distance(coord1, coord2):
    return geodesic(coord1, coord2).miles

# Initialize Geocoder
geolocator = Nominatim(user_agent="slackbracket_geocoder")

# Fetch and cache geocode data
def fetch_and_cache_geocodes(names, cache_file):
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            cache = json.load(f)
    else:
        cache = {}

    for name in names:
        if name not in cache:
            coord = geocode_location(name)
            if coord := coord:
                cache[name] = coord
                print(f"Geocoded '{name}': {cache[name]}")
                time.sleep(1)  # to avoid rate limits
        else:
            print(f"Using cached coordinates for {name}")
            
    with open(cache_file, 'w') as f:
        json.dump(cache, f)

    return cache

# Initialize geolocator once
geolocator = Nominatim(user_agent="slackbracket_geocoder")

# Get school names
schools_df = pd.read_csv(schools_csv)
schools = schools_df['Team'].dropna().unique().tolist()

# Get venue names
venues_df = pd.read_csv(venues_csv)
venues = venues_df['Venue'] + ", " + venues_df['City']

# Geocode schools and venues
school_geocodes = fetch_and_cache_geocodes(schools, schools_cache)
venue_geocodes = fetch_and_cache_geocodes(venues_df['Venue'] + ', ' + venues_df['City'], venues_cache)

# Calculate distances and save
distance_results = []
distances = []
for school, school_coord in school_geocodes.items():
    for venue, venue_coord in venue_geocodes.items():
        distance = geodesic(school_geocodes[school], venue_geocodes[venue]).miles
        distances.append({
            'School': school,
            'Venue': venue,
            'Distance_Miles': round(distance, 2)
        })

# Save to CSV
distances_df = pd.DataFrame(distances)
distances_df.to_csv(os.path.join(os.path.dirname(script_dir), 'data', 'school_venue_distances.csv'), index=False)

print("Geocoding and distance calculations completed and cached.")
