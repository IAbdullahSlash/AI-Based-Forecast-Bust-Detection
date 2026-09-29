// Builds src/data/indiaStates.topo.json, a compact state-level India map.
//
// Source: https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/topojson/india.json
// (github.com/udit-001/india-maps-data; official Indian boundary, states + UTs).
// Usage: node scripts/build-map.mjs <path-to-downloaded-india.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, quantile, simplify } from 'topojson-simplify';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/build-map.mjs <path-to-india.json>');
  process.exit(1);
}

const input = JSON.parse(readFileSync(source, 'utf8'));
const states = feature(input, input.objects.states);
for (const state of states.features) {
  state.properties = { name: state.properties.st_nm };
}

let output = presimplify(topology({ states }, 1e5));
output = simplify(output, quantile(output, 0.12));
// Drop the per-point weights that presimplify adds, then shrink precision.
output.arcs = output.arcs.map((arc) => arc.map(([x, y]) => [x, y]));
const outputPath = new URL('../src/data/indiaStates.topo.json', import.meta.url);
writeFileSync(outputPath, JSON.stringify(output));
console.log(`Wrote ${states.features.length} states, ${(JSON.stringify(output).length / 1024).toFixed(0)} KB`);
