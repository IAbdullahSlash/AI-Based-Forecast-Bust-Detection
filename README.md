# AI Forecast Bust Detection

> Prototype scope: rainfall and temperature forecast-bust detection for 25 Indian states at lead times Day 1–10. The hindcast archive (6,000 forecast/observation pairs, 2016–2023) and the current 10-day forecast scenario are **synthetic**. The NetCDF files in `dataset/` are real NCMRWF Unified Model hindcast rainfall. They are ingested and displayed, but they can't drive bust statistics until matching observations are added.

## How the bust probability is computed

1. **Bust definition:** an absolute forecast error larger than 90% of that region's short-range (Day 1–3) errors (P90), with a floor of 15 mm or 2 °C. The threshold is fixed across lead times, so longer leads bust more often.
2. **ML model:** L2-regularised logistic regression trained in-app on forecast-time predictors. These are intensity, temperature and pressure anomalies, pressure tendency, lead time and weather regime (cyclone, monsoon depression, western disturbance, heat wave, active/break monsoon, and so on). It is verified on held-out 2023 cases (AUC ≈ 0.84–0.88).
3. **k-NN analogues:** the 7 most similar historical cases at a similar lead time. Their similarity-weighted bust rate gives a second estimate.
4. **Blend:** 60% ML plus 40% analogues. Confidence is **Low** at 40% or above, **Medium** from 20% to 40%, and **High** below 20%.
5. **Explainability:** rule-based meteorological reasons (active system, pressure tendency, deep low, IMD rainfall categories, heat-wave criteria, lead-time error growth, analogue outcomes) plus the model features that push the probability up. An optional Gemini briefing turns these into prose.

## JSON API (`npm run server`, port 8787)

| Endpoint | Returns |
|---|---|
| `GET /api/confidence?day=1..10&variable=rainfall\|temperature` | Confidence, bust probability and reasons for every region |
| `GET /api/region?name=Odisha&day=5&variable=rainfall` | Full result, analogues, lead-time error curve and explanation for one region |
| `GET /api/heatmap?variable=rainfall` | Region × Day 1–10 bust-probability matrix |
| `GET /api/error-prone?variable=rainfall` | Regions with at least one low-confidence day |
| `GET /api/model` | Verification metrics for both bust models |
| `GET /api/nwp` | Per-state rainfall extracted from the NCMRWF NetCDF files |
| `GET /api/dataset/status` | Catalogue of `dataset/*.nc` files |
| `POST /api/gemini/explanation` | Gemini briefing (needs `GEMINI_API_KEY`) |

The server imports the same TypeScript engine as the dashboard, so it needs Node ≥ 22.18, which runs `.ts` files through type stripping.

## Real data: NCMRWF forecasts + IMD observations

- `dataset/s2s/*.nc`: NCMRWF S2S hindcast forecasts from rds.ncmrwf.gov.in: runs 2015-06-01, 07-01, 08-01 and 09-01, day00–10, with rainfall, sea-level pressure and 10 m wind. Extract with `npm run extract:nwp`.
- `dataset/IMD/RF25_ind<YEAR>_rfp25.nc`: IMD Pune 0.25° gridded daily rainfall (currently 2015 and 2022–2024). Extract with `npm run extract:imd` (needs `scipy`).
- Both are averaged over the same state boundaries and joined on state + valid date (IMD date = run date + NN for file `dayNN`). The result is **1,100 real forecast/observation pairs**, shown in the dashboard's *Real observations & verification* section and served at `/api/verification`.
- Real error grows with lead time (about 4 mm at Days 1–4, 6–8 mm at Days 5–10, 18% busts at Day 10). The largest busts are orographic heavy rain in Meghalaya and Sikkim (strongly under-forecast), and Day 0 has a dry bias (model spin-up).
- `dataset/IMD/Tmax/Maxtemp_MaxT_<YEAR>.GRD`: IMD 1° gridded daily maximum temperature (2015, 2022–2024). Extract with `npm run extract:tmax`. The S2S 925 hPa temperature forecast is converted to surface Tmax with MOS, fitted leave-one-run-out, which gives **1,000 real temperature pairs**. MAE drops from 7.8 °C (raw) to 2.1 °C, and error grows from about 1.5 °C (Day 2) to 2.7 °C (Day 9). The worst busts (10 July 2015, central India forecast 38 °C vs 28 °C observed) coincide with the Bay of Bengal low seen in IMDAA. Caveat: June is about 2.7 °C too cold because the correction is learned from monsoon months.
- A **real bust model** is trained on these pairs and scored leave-one-run-out: held-out AUC 0.75, 17% Brier skill. Forecast rainfall alone reaches 0.78, so more runs are needed to show the extra predictors add ranking skill (`/api/real-model`).
- IMD June normals replace the hand-set rainfall climatology, and the explanation engine cites observed percentiles and each state's real error record.
- `dataset/IMDAA/`: NCMRWF IMDAA reanalysis (850/200 hPa temperature and wind, 3-hourly, 1–10 June and 1–10 July 2015). Extract with `npm run extract:imdaa`. It powers the **real case studies** (Scenario switch → Jun 2015 / Jul 2015): real busts by state and day, weather systems diagnosed from the reanalysis (e.g. Cyclone Ashobaa, 6–10 June 2015), and a check of whether rule-based risk flags anticipated the busts. Also served at `/api/case`.
- Still synthetic: the 6,000-pair training archive and the 10-day demo scenario. Replacing them needs more NCMRWF runs (ideally daily initialisations over several monsoons) paired the same way.

## India map

State boundaries come from [udit-001/india-maps-data](https://github.com/udit-001/india-maps-data), which follows the official Indian boundary. `scripts/build-map.mjs` reduces them to a small state-level TopoJSON bundled with the app, so no map API or key is needed and the demo works offline.

## Gemini evidence briefings

The Gemini key is read only by `server.mjs`; never rename it to a `VITE_` variable. Run the API/server with `npm run server`, then use the **Generate** button in the dashboard. For local development, also run `npm run dev` in a second terminal; Vite proxies `/api` to the server. The default model is `gemini-3.5-flash`; override it with `GEMINI_MODEL` in `.env` only if your Gemini account requires another available model.

## NetCDF forecast ingestion

Place forecast NetCDF files in `dataset/` using the naming pattern `<variable>_ICYYYYMMDD_dayNN.nc`, such as `APCP-sfc_IC20150601_day05.nc`. `/api/dataset/status` lists them. `npm run extract:nwp` (needs `pip install h5py numpy`) averages each state's grid points within ±1° into `src/data/nwpForecasts.json`, and the dashboard shows the result in the **Real NWP ingestion** panel. The next step is pairing these forecasts with IMD gridded observations for the same valid dates. Each pair becomes a row of the hindcast archive in place of the synthetic records in `src/data/demoDataset.ts`.

A real-time dashboard for monitoring **forecast confidence** and **bust probability** across Indian states — built with React, TypeScript, Tailwind CSS, and Vite.

---

## 🎯 What This Does

This application helps meteorologists and analysts identify regions where weather forecasts are likely to "bust" (fail) or carry low confidence. It combines:

- **Interactive India map** — zoomable, pannable, clickable state markers with real-time color coding
- **Confidence scoring** — High / Medium / Low per region based on historical error patterns
- **Bust probability** — likelihood that the forecast will be significantly wrong
- **Live weather data** — pulls real temperature, rainfall, wind, and pressure from the Open-Meteo API
- **Historical analogues** — similar past events with outcomes
- **AI explanations** — why a region's forecast confidence is low

---

## 🖥️ Screens & Features

### Header
- App title with rain icon
- Demo mode badge
- Current date

### Variable Selector
- Rainfall, Temperature, Wind, Pressure — click to switch the forecast variable

### Day Selector
- 10-day forecast timeline with color-coded confidence dots

### India Map (main area)
- **Zoom**: Scroll wheel centered on cursor
- **Pan**: Click and drag
- **Zoom controls**: +, −, Reset buttons
- **State markers**: Colored circles (green/yellow/red) showing confidence or bust probability
- **Hover**: Animated glow ring + tooltip with forecast, bust prob, confidence
- **Click**: Select a region → opens detail panel
- **Selection ring**: Dashed animated border on selected state

### Detail Panel (right side, when a region is selected)
- Bust probability with progress bar
- Forecast value (mm), confidence level, mean error, bust frequency
- Gauge chart showing historical bust frequency
- Key reasons for low confidence
- Historical analogues table (event type, region, date, similarity, error, status)
- AI-generated explanation for the region

### Bottom Section
- **AI Explanation** — why confidence is low for the selected region
- **Historical Analogues** — similar past events
- **Data Sources** — expandable list of data feeds
- **System Status** — service health indicators

### Live Weather Panel
- Fetches real-time weather via Open-Meteo API
- Shows temperature, rainfall, wind speed, pressure per state
- Color-coded by forecast confidence
- "Live Weather" button to trigger fetch

---

## 🏗️ Architecture

```
src/
├── api/
│   └── weatherApi.ts        # Open-Meteo API service + region coordinates
├── components/
│   └── IndiaMap.tsx         # Interactive zoomable/pannable SVG map
├── data/
│   └── mockData.ts          # Mock regional data, confidence engine, analogues
├── hooks/
│   └── useWeatherData.ts    # React hooks for weather data fetching
├── types/
│   └── index.ts             # TypeScript types (Confidence, RegionalData, etc.)
├── App.tsx                  # Main application layout
├── main.tsx                 # Entry point
└── index.css                # Global styles + Tailwind imports
```

---

## 🔑 Key Types

| Type | Description |
|------|-------------|
| `Confidence` | `'high' \| 'medium' \| 'low'` |
| `ForecastVariable` | `'rainfall' \| 'temperature' \| 'wind' \| 'pressure'` |
| `RegionalData` | Forecast value, bust probability, confidence, historical error stats |
| `HistoricalAnalogue` | Past event with similarity score and bust status |
| `StatePosition` | Region name + SVG coordinates + optional lat/lng |

---

## 🌤️ Live Weather API

**Open-Meteo** (`https://api.open-meteo.com/v1/forecast`)

- Free, no API key required
- Provides: temperature, precipitation, wind speed, pressure, humidity
- Coverage: All 25 Indian states with precise lat/lng
- Configurable via `.env`: `VITE_WEATHER_API_URL`

### Region Coordinates
Each state has approximate lat/lng in `src/api/weatherApi.ts` (`REGION_COORDINATES`).

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Dev server runs at `http://localhost:5173`.

---

## 📦 Environment Variables

Create a `.env` file in the project root:

```env
# Open-Meteo base URL (default is used if empty)
VITE_WEATHER_API_URL=https://api.open-meteo.com/v1/forecast

# Future APIs (when needed)
# VITE_OPENWEATHER_API_KEY=your_key_here
```

Vite automatically loads `.env` files with the `VITE_` prefix.

---

## 🎨 Color Scheme

| Meaning | Color |
|---------|-------|
| High confidence | Green (`#22c55e`) |
| Medium confidence | Yellow (`#eab308`) |
| Low confidence | Red (`#ef4444`) |
| Low bust probability | Blue (`#3b82f6`) |
| High bust probability | Red (`#ef4444`) |

---

## 📝 Notes

- Forecast confidence and bust probability are computed from historical error patterns
- Explanations are rule-based meteorological reasons plus an optional Gemini narrative
- Historical analogues come from the synthetic hindcast archive; replace it with real paired records for production
- The map uses SVG `viewBox` for zoom/pan — no external mapping library needed

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build | Vite 5 |
| Icons | Lucide React |
| API | Open-Meteo (free weather) |
