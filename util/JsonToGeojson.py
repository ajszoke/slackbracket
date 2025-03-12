import json
import os

# Get path to the data directory
script_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(os.path.dirname(script_dir), 'data', 'school_geocodes.json')) as f:
    data = json.load(f)

geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {"school": school},
        "geometry": {
            "type": "Point",
            "coordinates": [coord[1], coord[0]]  # [lon, lat]
        }
    } for school, coord in data.items()]
}

with open(os.path.join(os.path.dirname(script_dir), 'data', 'schools.geojson'), 'w') as f:
    json.dump(geojson, f)