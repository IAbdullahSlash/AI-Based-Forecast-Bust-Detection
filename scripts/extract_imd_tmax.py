"""Aggregate IMD 1° gridded daily maximum temperature to per-state series.

Reads dataset/IMD/Tmax/Maxtemp_MaxT_<YEAR>.GRD (IMD Pune binary: little-endian
float32, 31×31 grid, lat 7.5–37.5°N and lon 67.5–97.5°E ascending, one grid per
day, 99.9 = missing), averages the cells inside each state's boundary, and
writes src/data/imdTmax.json.

Requires: pip install numpy matplotlib
Run:      npm run extract:tmax
"""
import json
import re
from datetime import date, timedelta

import numpy as np

from state_masks import ROOT, state_masks

SOURCE_DIR = ROOT / 'dataset' / 'IMD' / 'Tmax'
OUTPUT = ROOT / 'src' / 'data' / 'imdTmax.json'
FILE_PATTERN = re.compile(r'^Maxtemp_MaxT_(\d{4})\.GRD$', re.IGNORECASE)
LAT = np.arange(7.5, 37.51, 1.0)
LON = np.arange(67.5, 97.51, 1.0)
HOT_DAY_C = 40.0  # IMD heat-wave consideration starts at Tmax ≥ 40 °C in the plains


def main():
    files = sorted((m.group(1), p) for p in SOURCE_DIR.glob('*') if (m := FILE_PATTERN.match(p.name)))
    if not files:
        raise SystemExit(f'No Maxtemp_MaxT_<YEAR>.GRD files in {SOURCE_DIR}')
    masks = state_masks(LAT, LON)

    years, by_region = {}, {}
    for year, path in files:
        raw = np.fromfile(path, dtype='<f4')
        days = raw.size // (len(LAT) * len(LON))
        grid = raw[:days * len(LAT) * len(LON)].reshape(days, len(LAT), len(LON)).astype(float)
        grid[grid > 90] = np.nan
        start = date(int(year), 1, 1)
        months = np.array([(start + timedelta(days=i)).month for i in range(days)])
        entry = {'start': start.isoformat(), 'days': days, 'regions': {}}
        for name, mask in masks.items():
            series = np.nanmean(grid[:, mask], axis=1)
            entry['regions'][name] = [None if np.isnan(v) else round(float(v), 1) for v in series]
            stats = by_region.setdefault(name, {'values': [], 'months': [], 'cells': int(mask.sum()), 'hotDays': {}})
            stats['values'].extend(series)
            stats['months'].extend(months)
            stats['hotDays'][year] = int(np.nansum(series >= HOT_DAY_C))
        years[year] = entry
        print(f'{year}: {days} days')

    summary = {}
    for name, stats in by_region.items():
        values = np.array(stats['values']); months = np.array(stats['months'])
        monthly = []
        for month in range(1, 13):
            v = values[(months == month) & np.isfinite(values)]
            monthly.append({
                'mean': round(float(np.mean(v)), 1) if v.size else None,
                'p95': round(float(np.percentile(v, 95)), 1) if v.size else None,
            })
        summary[name] = {'gridCells': stats['cells'], 'monthly': monthly, 'hotDays': stats['hotDays']}

    OUTPUT.write_text(json.dumps({
        'source': 'IMD Pune 1° gridded daily maximum temperature',
        'note': 'State values are area means of the 1° grid cells inside each state boundary (°C); small states use the nearest cell. '
                f'Hot days: state-mean Tmax ≥ {HOT_DAY_C:.0f} °C.',
        'years': years,
        'summary': summary,
    }, separators=(',', ':')), encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
