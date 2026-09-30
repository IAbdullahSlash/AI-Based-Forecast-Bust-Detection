"""Aggregate NCMRWF S2S hindcast forecasts to per-state daily values.

Reads <VARIABLE>_ICYYYYMMDD_dayNN.nc files from dataset/s2s/ (and, for older
downloads, dataset/ itself; dataset/s2s wins on duplicates). Supported
variables: APCP-sfc (rainfall), PRMSL-msl (mean sea-level pressure),
UGRD-10m / VGRD-10m (10 m wind), and TMP_IC…_dayNN_<level>.nc (temperature at
925 / 850 hPa). Values are averaged over the grid cells inside
each state's boundary (same masks as the IMD observations) and written to
src/data/nwpForecasts.json.

Requires: pip install h5py numpy matplotlib   (NetCDF4 files are HDF5 underneath)
Run:      npm run extract:nwp
"""
import json
import re
from collections import defaultdict

import h5py
import numpy as np

from state_masks import ROOT, state_masks

DATASET = ROOT / 'dataset'
SOURCES = [DATASET, DATASET / 's2s']  # later entries override earlier ones
OUTPUT = ROOT / 'src' / 'data' / 'nwpForecasts.json'
FILE_PATTERN = re.compile(r'^([A-Za-z0-9-]+)_IC(\d{8})_day(\d{2})(?:_(\d+))?\.nc$')
VARIABLES = {'APCP-sfc': 'apcp', 'PRMSL-msl': 'mslp', 'UGRD-10m': 'u', 'VGRD-10m': 'v', 'TMP-925': 'temp', 'TMP-850': 'temp'}


def read(path, key):
    with h5py.File(path, 'r') as nc:
        field = np.squeeze(nc[key][...]).astype(float)
        fill = nc[key].attrs.get('_FillValue', [2e20])[0]
        field[np.abs(field) >= abs(fill) * 0.99] = np.nan
        lat = nc['latitude'][:]
        lon = nc['longitude'][:]
        source = nc[key].attrs.get('source', b'')
    return field, lat, lon, source.decode() if isinstance(source, bytes) else str(source)


def main():
    files = {}
    for folder in SOURCES:
        for path in folder.glob('*.nc'):
            match = FILE_PATTERN.match(path.name)
            if not match:
                continue
            variable = f'{match.group(1)}-{match.group(4)}' if match.group(4) else match.group(1)
            if variable in VARIABLES:
                files[(variable, match.group(2), int(match.group(3)))] = path

    masks_by_grid = {}
    values = defaultdict(dict)  # (init, day) -> {variable: {region: mean}}
    rain_max = defaultdict(dict)
    india_max = {}
    source = None
    for (variable, init, day), path in sorted(files.items()):
        field, lat, lon, file_source = read(path, VARIABLES[variable])
        source = source or file_source
        grid = (len(lat), float(lat[0]), len(lon), float(lon[0]))
        if grid not in masks_by_grid:
            masks_by_grid[grid] = state_masks(lat, lon)
        masks = masks_by_grid[grid]
        values[(init, day)][variable] = {name: float(np.nanmean(field[mask])) for name, mask in masks.items()}
        if variable == 'APCP-sfc':
            rain_max[(init, day)] = {name: float(np.nanmax(field[mask])) for name, mask in masks.items()}
            india = (lat[:, None] >= 6) & (lat[:, None] <= 37) & (lon[None, :] >= 68) & (lon[None, :] <= 98)
            india_max[(init, day)] = round(float(np.nanmax(np.where(india, field, np.nan))), 1)

    initializations = {}
    names = sorted({name for entry in values.values() for per in entry.values() for name in per})
    for init in sorted({init for init, _ in values}):
        days = sorted(day for i, day in values if i == init and 'APCP-sfc' in values[(i, day)])
        regions = {}
        for name in names:
            series = []
            for day in days:
                entry = values[(init, day)]
                cell = {
                    'mean': round(entry['APCP-sfc'][name], 1),
                    'max': round(rain_max[(init, day)][name], 1),
                }
                if 'PRMSL-msl' in entry:
                    cell['mslp'] = round(entry['PRMSL-msl'][name] / 100, 1)   # Pa → hPa
                if 'UGRD-10m' in entry and 'VGRD-10m' in entry:
                    u, v = entry['UGRD-10m'][name], entry['VGRD-10m'][name]
                    cell['u10'] = round(u, 1)
                    cell['v10'] = round(v, 1)
                    cell['wind'] = round(float(np.hypot(u, v)), 1)            # m/s, speed of the state-mean wind
                for level in ('925', '850'):
                    if f'TMP-{level}' in entry:
                        cell[f't{level}'] = round(entry[f'TMP-{level}'][name] - 273.15, 1)  # K → °C
                series.append(cell)
            regions[name] = series
        initializations[f'{init[:4]}-{init[4:6]}-{init[6:]}'] = {
            'variable': 'APCP-sfc', 'days': days, 'regions': regions,
            'indiaMax': [india_max[(init, day)] for day in days],
        }
        print(f'{init}: days {days[0]}–{days[-1]}, variables {sorted({v for d in days for v in values[(init, d)]})}')

    OUTPUT.write_text(json.dumps({
        'source': source or 'Unknown model',
        'note': 'NCMRWF S2S hindcast (Unified Model GC2), state means over grid cells inside each state boundary. '
                'Rainfall is a 24 h total in mm (the file attribute says kg m-2 s-1, but magnitudes match daily totals); '
                'mslp in hPa; 10 m wind in m/s; t925/t850 = forecast temperature at 925/850 hPa in °C.',
        'initializations': initializations,
    }, separators=(',', ':')), encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} with {len(initializations)} runs and {len(names)} regions.')


if __name__ == '__main__':
    main()
