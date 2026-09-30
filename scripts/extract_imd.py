"""Aggregate IMD 0.25° gridded daily rainfall to per-state series and statistics.

Reads every dataset/IMD/RF25_ind<YEAR>_rfp25.nc (IMD Pune gridded rainfall,
NetCDF-3), averages grid cells inside each state's boundary, and writes
src/data/imdObservations.json for the dashboard, API and verification join.

Requires: pip install scipy numpy matplotlib
Run:      npm run extract:imd
"""
import json
import re
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from scipy.io import netcdf_file

from state_masks import ROOT, state_masks

SOURCE_DIR = ROOT / 'dataset' / 'IMD'
OUTPUT = ROOT / 'src' / 'data' / 'imdObservations.json'
FILE_PATTERN = re.compile(r'^RF25_ind(\d{4})_rfp25\.nc$')
HEAVY_MM = 64.5            # IMD "heavy rain" threshold (24 h)
EXTREME_MM = 204.5         # IMD "extremely heavy" threshold
WIDESPREAD_FRACTION = 0.1  # share of state area that must see heavy rain
MONSOON_MONTHS = (6, 7, 8, 9)


def read_year(path):
    with netcdf_file(path, 'r', mmap=False) as nc:
        rain = nc.variables['RAINFALL'].data.astype(float)
        lat = nc.variables['LATITUDE'].data.astype(float)
        lon = nc.variables['LONGITUDE'].data.astype(float)
        days = nc.variables['TIME'].data.astype(float)
        origin = nc.variables['TIME']._attributes.get('units', b'').decode()
    rain[rain < 0] = np.nan  # -999 fill over sea / outside India
    base = date.fromisoformat(re.search(r'since (\d{4}-\d{2}-\d{2})', origin).group(1))
    dates = [base + timedelta(days=int(d)) for d in days]
    return rain, lat, lon, dates


def main():
    files = sorted((m.group(1), p) for p in SOURCE_DIR.glob('*.nc') if (m := FILE_PATTERN.match(p.name)))
    if not files:
        raise SystemExit(f'No RF25_ind<YEAR>_rfp25.nc files in {SOURCE_DIR}')

    masks = None
    years = {}
    by_region = {}
    for year, path in files:
        rain, lat, lon, dates = read_year(path)
        if masks is None:
            masks = state_masks(lat, lon)
        months = np.array([d.month for d in dates])
        entry = {'start': dates[0].isoformat(), 'days': len(dates), 'regions': {}}
        for name, mask in masks.items():
            cells = rain[:, mask]                                  # (days, cells)
            areal = np.nanmean(cells, axis=1)
            heavy_share = np.nanmean(cells >= HEAVY_MM, axis=1)
            cell_max = np.nanmax(cells, axis=1)
            entry['regions'][name] = [round(float(v), 1) for v in areal]
            stats = by_region.setdefault(name, {'areal': [], 'months': [], 'dates': [], 'heavyShare': [], 'cellMax': [],
                                                'cells': int(mask.sum()), 'seasonTotals': {}, 'heavyDays': {}, 'extremeDays': {}})
            stats['areal'].extend(areal); stats['months'].extend(months); stats['dates'].extend(dates)
            stats['heavyShare'].extend(heavy_share); stats['cellMax'].extend(cell_max)
            monsoon = np.isin(months, MONSOON_MONTHS)
            stats['seasonTotals'][year] = round(float(np.nansum(areal[monsoon])), 0)
            stats['heavyDays'][year] = int(np.sum(heavy_share[monsoon] >= WIDESPREAD_FRACTION))
            stats['extremeDays'][year] = int(np.sum(cell_max[monsoon] >= EXTREME_MM))
        years[year] = entry
        print(f'{year}: {len(dates)} days, {len(masks)} regions')

    summaries = {}
    for name, stats in by_region.items():
        areal = np.array(stats['areal']); months = np.array(stats['months'])
        cell_max = np.array(stats['cellMax'])
        monthly = []
        for month in range(1, 13):
            values = areal[months == month]
            monthly.append({
                'mean': round(float(np.nanmean(values)), 1),
                'p95': round(float(np.nanpercentile(values, 95)), 1),
                'p99': round(float(np.nanpercentile(values, 99)), 1),
            })
        peak = int(np.nanargmax(cell_max))
        summaries[name] = {
            'gridCells': stats['cells'],
            'monthly': monthly,
            'monsoonTotal': stats['seasonTotals'],
            'widespreadHeavyDays': stats['heavyDays'],
            'extremeCellDays': stats['extremeDays'],
            'maxCellRain': {'mm': round(float(cell_max[peak]), 1), 'date': stats['dates'][peak].isoformat()},
        }

    OUTPUT.write_text(json.dumps({
        'source': 'IMD Pune 0.25° gridded daily rainfall (RF25)',
        'note': 'State values are area means of grid cells inside each state boundary (mm/day). '
                'Monsoon = June–September. Widespread heavy day: ≥10% of the state area receives ≥64.5 mm. '
                'Extreme day: at least one grid cell ≥204.5 mm.',
        'years': years,
        'summary': summaries,
    }, separators=(',', ':')), encoding='utf-8')
    size = OUTPUT.stat().st_size / 1024
    print(f'Wrote {OUTPUT.relative_to(ROOT)} ({size:.0f} KB)')


if __name__ == '__main__':
    main()
