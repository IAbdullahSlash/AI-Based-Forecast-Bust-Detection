"""Aggregate NCMRWF NetCDF rainfall forecasts in dataset/ to per-state values.

Reads every <variable>_ICYYYYMMDD_dayNN.nc file, averages the grid points
within +/-1 degree of each state's centroid, and writes
src/data/nwpForecasts.json for the dashboard and API.

Requires: pip install h5py numpy   (NetCDF4 files are HDF5 underneath)
Run:      npm run extract:nwp
"""
import json
import re
from pathlib import Path

import h5py
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT / 'dataset'
OUTPUT = ROOT / 'src' / 'data' / 'nwpForecasts.json'
REGIONS_TS = ROOT / 'src' / 'data' / 'regions.ts'
BOX_DEGREES = 1.0
FILE_PATTERN = re.compile(r'^([A-Za-z0-9-]+)_IC(\d{8})_day(\d{2})\.nc$')


def region_centroids():
    """Read state names and lat/lng from regions.ts so there is one source of truth."""
    text = REGIONS_TS.read_text(encoding='utf-8')
    pattern = re.compile(r"\{ name: '([^']+)', x: \d+, y: \d+, lat: ([\d.]+), lng: ([\d.]+) \}")
    return [(name, float(lat), float(lng)) for name, lat, lng in pattern.findall(text)]


def main():
    centroids = region_centroids()
    initializations = {}
    source = None
    for path in sorted(DATASET.glob('*.nc')):
        match = FILE_PATTERN.match(path.name)
        if not match:
            continue
        variable, init, day = match.group(1), match.group(2), int(match.group(3))
        with h5py.File(path, 'r') as nc:
            field = nc['apcp'][0].astype(float)
            fill = nc['apcp'].attrs.get('_FillValue', [2e20])[0]
            field[field >= fill * 0.99] = np.nan
            lat = nc['latitude'][:]
            lon = nc['longitude'][:]
            if source is None:
                source = nc['apcp'].attrs.get('source', b'')
                source = source.decode() if isinstance(source, bytes) else str(source)

        init_key = f'{init[:4]}-{init[4:6]}-{init[6:]}'
        entry = initializations.setdefault(init_key, {'variable': variable, 'days': [], 'regions': {}, 'indiaMax': {}})
        entry['days'].append(day)
        india = (lat[:, None] >= 6) & (lat[:, None] <= 37) & (lon[None, :] >= 68) & (lon[None, :] <= 98)
        entry['indiaMax'][day] = round(float(np.nanmax(np.where(india, field, np.nan))), 1)
        for name, clat, clng in centroids:
            box = (np.abs(lat[:, None] - clat) <= BOX_DEGREES) & (np.abs(lon[None, :] - clng) <= BOX_DEGREES)
            values = field[box]
            entry['regions'].setdefault(name, {})[day] = {
                'mean': round(float(np.nanmean(values)), 1),
                'max': round(float(np.nanmax(values)), 1),
            }

    for entry in initializations.values():
        entry['days'].sort()
        for name, by_day in entry['regions'].items():
            entry['regions'][name] = [by_day[day] for day in entry['days']]
        entry['indiaMax'] = [entry['indiaMax'][day] for day in entry['days']]

    OUTPUT.write_text(json.dumps({
        'source': source or 'Unknown model',
        'note': 'NCMRWF Unified Model hindcast rainfall, 24 h totals (mm) averaged within ±1° of each state centroid. '
                'The file attribute says kg m-2 s-1, but magnitudes match daily accumulations, so values are treated as mm/day.',
        'initializations': initializations,
    }, indent=1), encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} with {len(initializations)} initializations and {len(centroids)} regions.')


if __name__ == '__main__':
    main()
