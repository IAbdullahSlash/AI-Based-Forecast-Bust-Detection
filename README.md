# AI Forecast Bust Detection

> Current prototype scope: a deterministic rainfall MVP. It aligns local forecast/observation pairs, calculates error metrics and a P90 bust threshold, retrieves similar cases, and derives a transparent probability. The local data is synthetic and must be replaced with archived NWP plus matching observations before operational use.

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
- The "AI explanation" is a template-based explanation engine
- Historical analogues are pre-seeded mock data — replace with real historical records for production
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
