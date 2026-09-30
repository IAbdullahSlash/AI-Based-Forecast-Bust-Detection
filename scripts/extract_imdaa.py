"""Daily per-state diagnostics from IMDAA reanalysis for the real case studies.

Reads dataset/IMDAA/{TMP,UGRD,VGRD}-{850,200}mb_YYYYMMDDHH_ncum_imdaa_reanl_prl_*.nc
(NCMRWF IMDAA 0.12° regional reanalysis), averages the available 3-hourly times
into daily means, and computes per state:
  850 hPa wind speed / westerly component / relative vorticity (monsoon flow, lows),
  850 hPa temperature (lower-tropospheric heat), 200 hPa wind speed (upper jet),
  and 850–200 hPa vertical wind shear.
Also records the strongest 850 hPa cyclonic circulation over the Arabian Sea and
Bay of Bengal each day. Writes src/data/imdaaAnalysis.json.

Requires: pip install h5py numpy matplotlib
Run:      npm run extract:imdaa
"""
import json
import re
from collections import defaultdict
from datetime import date

import h5py
import numpy as np

from state_masks import ROOT, state_masks

SOURCE_DIR = ROOT / 'dataset' / 'IMDAA'
OUTPUT = ROOT / 'src' / 'data' / 'imdaaAnalysis.json'
PATTERN = re.compile(r'^(TMP|UGRD|VGRD)-(850|200)mb_(\d{8})(\d{2})_ncum_imdaa_reanl_prl_\d{2}_(\d+)_hpa\.nc$')
VARIABLE_KEYS = {'TMP': 't', 'UGRD': 'u', 'VGRD': 'v'}
MIN_TIMES = 2          # daily mean needs at least this many 3-hourly times
EARTH_RADIUS = 6.371e6
SEAS = {'Arabian Sea': (8, 22, 58, 74), 'Bay of Bengal': (10, 23, 81, 92)}


def read_field(path, key):
    with h5py.File(path, 'r') as nc:
        field = nc[key][0, 0].astype(float)
        lat = nc['lat'][:].astype(float)
        lon = nc['lon'][:].astype(float)
    field[np.abs(field) > 1e10] = np.nan
    return field, lat, lon


def vorticity(u, v, lat, lon):
    """Relative vorticity dv/dx − du/dy (s⁻¹) on a regular lat/lon grid."""
    phi = np.deg2rad(lat)[:, None]
    dx = EARTH_RADIUS * np.cos(phi) * np.deg2rad(np.gradient(lon))[None, :]
    dy = EARTH_RADIUS * np.deg2rad(np.gradient(lat))[:, None]
    return np.gradient(v, axis=1) / dx - np.gradient(u, axis=0) / dy


def main():
    files = defaultdict(list)  # (date, var, level) -> [paths]
    for path in SOURCE_DIR.glob('*.nc'):
        match = PATTERN.match(path.name)
        if match and match.group(5) == match.group(2):
            var, level, day = match.group(1), match.group(2), match.group(3)
            files[(day, var, level)].append(path)
    if not files:
        raise SystemExit(f'No IMDAA files in {SOURCE_DIR}')

    days = sorted({key[0] for key in files})
    masks = None
    lat = lon = None
    output_days = {}
    for day in days:
        means, counts = {}, {}
        for var in VARIABLE_KEYS:
            for level in ('850', '200'):
                paths = files.get((day, var, level), [])
                counts[f'{var}{level}'] = len(paths)
                if len(paths) < MIN_TIMES:
                    continue
                stack = []
                for path in paths:
                    field, lat, lon = read_field(path, VARIABLE_KEYS[var])
                    stack.append(field)
                means[f'{var}{level}'] = np.nanmean(stack, axis=0)
        iso = date(int(day[:4]), int(day[4:6]), int(day[6:])).isoformat()
        complete = all(k in means for k in ('UGRD850', 'VGRD850'))
        entry = {'times': counts, 'complete': complete, 'regions': {}, 'seas': {}}
        if not complete:
            output_days[iso] = entry
            print(f'{iso}: skipped (850 hPa wind has too few times: {counts})')
            continue
        if masks is None:
            masks = state_masks(lat, lon)

        u850, v850 = means['UGRD850'], means['VGRD850']
        speed850 = np.hypot(u850, v850)
        vort850 = vorticity(u850, v850, lat, lon) * 1e5  # 10⁻⁵ s⁻¹
        t850 = means.get('TMP850')
        speed200 = np.hypot(means['UGRD200'], means['VGRD200']) if 'UGRD200' in means and 'VGRD200' in means else None
        shear = (np.hypot(means['UGRD200'] - u850, means['VGRD200'] - v850)
                 if speed200 is not None else None)

        def stat(array, mask, fn):
            if array is None:
                return None
            values = array[mask]
            values = values[np.isfinite(values)]
            return round(float(fn(values)), 1) if values.size else None

        for name, mask in masks.items():
            entry['regions'][name] = {
                'ws850': stat(speed850, mask, np.mean),
                'ws850Max': stat(speed850, mask, lambda x: np.percentile(x, 95)),
                'u850': stat(u850, mask, np.mean),
                'vort850': stat(vort850, mask, np.mean),
                'vort850Max': stat(vort850, mask, lambda x: np.percentile(x, 95)),
                't850': stat(t850 - 273.15 if t850 is not None else None, mask, np.mean),
                'ws200': stat(speed200, mask, np.mean),
                'shear': stat(shear, mask, np.mean),
            }
        for sea, (lat0, lat1, lon0, lon1) in SEAS.items():
            box = (lat[:, None] >= lat0) & (lat[:, None] <= lat1) & (lon[None, :] >= lon0) & (lon[None, :] <= lon1)
            # Smooth vorticity over ~1° so single-cell noise does not win.
            k = 8
            smooth = np.full_like(vort850, np.nan)
            core = vort850[k:-k, k:-k]
            acc = np.zeros_like(core)
            for dy in range(-k, k + 1, 2):
                for dx in range(-k, k + 1, 2):
                    acc += vort850[k + dy:vort850.shape[0] - k + dy, k + dx:vort850.shape[1] - k + dx]
            smooth[k:-k, k:-k] = acc / ((k + 1) ** 2)
            region = np.where(box, smooth, np.nan)
            index = np.unravel_index(np.nanargmax(region), region.shape)
            near = (np.abs(lat[:, None] - lat[index[0]]) <= 2.5) & (np.abs(lon[None, :] - lon[index[1]]) <= 2.5)
            entry['seas'][sea] = {
                'vortMax': round(float(region[index]), 1),
                'lat': round(float(lat[index[0]]), 1),
                'lon': round(float(lon[index[1]]), 1),
                'windMax': round(float(np.nanmax(np.where(near, speed850, np.nan))), 1),
            }
        output_days[iso] = entry
        print(f'{iso}: ok (times {counts})')

    OUTPUT.write_text(json.dumps({
        'source': 'NCMRWF IMDAA 0.12° regional reanalysis (pressure levels)',
        'note': 'Daily means of available 3-hourly analyses. Wind in m/s, vorticity in 10⁻⁵ s⁻¹ (positive = cyclonic), '
                'temperature in °C. State values use the same boundary masks as the forecasts and observations.',
        'days': output_days,
    }, separators=(',', ':')), encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
