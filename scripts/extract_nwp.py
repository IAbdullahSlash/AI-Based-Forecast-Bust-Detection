"""Aggregate NCMRWF NetCDF rainfall forecasts in dataset/ to per-state values.

Reads every <variable>_ICYYYYMMDD_dayNN.nc file, averages the grid cells inside
each state's boundary (same masks as the IMD observations), and writes
src/data/nwpForecasts.json for the dashboard, API and verification join.

Requires: pip install h5py numpy matplotlib   (NetCDF4 files are HDF5 underneath)
Run:      npm run extract:nwp
"""
import json
import re

import h5py
import numpy as np

from state_masks import ROOT, state_masks

DATASET = ROOT / 'dataset'
OUTPUT = ROOT / 'src' / 'data' / 'nwpForecasts.json'
FILE_PATTERN = re.compile(r'^([A-Za-z0-9-]+)_IC(\d{8})_day(\d{2})\.nc$')


def main():
    masks = None
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

        if masks is None:
            masks = state_masks(lat, lon)
        init_key = f'{init[:4]}-{init[4:6]}-{init[6:]}'
        entry = initializations.setdefault(init_key, {'variable': variable, 'days': [], 'regions': {}, 'indiaMax': {}})
        entry['days'].append(day)
        india = (lat[:, None] >= 6) & (lat[:, None] <= 37) & (lon[None, :] >= 68) & (lon[None, :] <= 98)
        entry['indiaMax'][day] = round(float(np.nanmax(np.where(india, field, np.nan))), 1)
        for name, mask in masks.items():
            values = field[mask]
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
        'note': 'NCMRWF Unified Model hindcast rainfall, 24 h totals (mm) averaged over grid cells inside each state boundary. '
                'The file attribute says kg m-2 s-1, but magnitudes match daily accumulations, so values are treated as mm/day.',
        'initializations': initializations,
    }, indent=1), encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} with {len(initializations)} initializations and {len(masks or {})} regions.')


if __name__ == '__main__':
    main()
