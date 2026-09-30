"""State boundary masks for gridded data.

Decodes src/data/indiaStates.topo.json (the dashboard's map) into polygons and
builds a boolean mask of grid cells whose centres fall inside each analysed
state, so gridded forecasts and observations are aggregated over identical areas.
"""
import json
import re
from pathlib import Path

import numpy as np
from matplotlib.path import Path as PolygonPath

ROOT = Path(__file__).resolve().parent.parent
TOPOLOGY = ROOT / 'src' / 'data' / 'indiaStates.topo.json'
REGIONS_TS = ROOT / 'src' / 'data' / 'regions.ts'
NAME_ALIASES = {'Jammu and Kashmir': 'Jammu & Kashmir'}


def analysed_regions():
    """(name, lat, lng) for the dashboard's regions, read from regions.ts."""
    text = REGIONS_TS.read_text(encoding='utf-8')
    pattern = re.compile(r"\{ name: '([^']+)', x: \d+, y: \d+, lat: ([\d.]+), lng: ([\d.]+) \}")
    return [(name, float(lat), float(lng)) for name, lat, lng in pattern.findall(text)]


def _decode_arcs(topology):
    if 'transform' not in topology:  # unquantized: arcs already hold absolute lon/lat
        return [[tuple(point[:2]) for point in arc] for arc in topology['arcs']]
    scale = topology['transform']['scale']
    translate = topology['transform']['translate']
    arcs = []
    for arc in topology['arcs']:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * scale[0] + translate[0], y * scale[1] + translate[1]))
        arcs.append(points)
    return arcs


def _ring(indices, arcs):
    points = []
    for index in indices:
        arc = arcs[index] if index >= 0 else arcs[~index][::-1]
        points.extend(arc if not points else arc[1:])
    return points


def state_polygons():
    """{state name: [polygon, ...]} where each polygon is [outer ring, *holes]."""
    topology = json.loads(TOPOLOGY.read_text(encoding='utf-8'))
    arcs = _decode_arcs(topology)
    result = {}
    for geometry in topology['objects']['states']['geometries']:
        name = NAME_ALIASES.get(geometry['properties']['name'], geometry['properties']['name'])
        polygons = [geometry['arcs']] if geometry['type'] == 'Polygon' else geometry['arcs']
        result[name] = [[_ring(ring, arcs) for ring in polygon] for polygon in polygons]
    return result


def state_masks(lat, lon, names=None):
    """{state: bool mask shaped (len(lat), len(lon))} for 1-D coordinate arrays.

    States smaller than the grid (e.g. Goa, Sikkim at coarse resolution) fall
    back to the single cell nearest their centroid so they are never empty.
    """
    lon_grid, lat_grid = np.meshgrid(lon, lat)
    points = np.column_stack([lon_grid.ravel(), lat_grid.ravel()])
    polygons = state_polygons()
    regions = analysed_regions()
    wanted = set(names) if names else {name for name, _, _ in regions}
    masks = {}
    for name, clat, clng in regions:
        if name not in wanted:
            continue
        inside = np.zeros(len(points), dtype=bool)
        for polygon in polygons.get(name, []):
            outer = PolygonPath(polygon[0]).contains_points(points)
            for hole in polygon[1:]:
                outer &= ~PolygonPath(hole).contains_points(points)
            inside |= outer
        mask = inside.reshape(lat_grid.shape)
        if not mask.any():
            mask[np.abs(lat - clat).argmin(), np.abs(lon - clng).argmin()] = True
        masks[name] = mask
    return masks
