import type { EventType, RegionClimatology, StatePosition } from '../types/index.ts';
import { observedMonthly, observedTmaxMonthly } from './observations.ts';

export const STATE_POSITIONS: StatePosition[] = [
  { name: 'Jammu & Kashmir', x: 420, y: 110, lat: 33.8, lng: 74.8 },
  { name: 'Himachal Pradesh', x: 470, y: 175, lat: 31.1, lng: 77.2 },
  { name: 'Punjab', x: 530, y: 230, lat: 30.7, lng: 75.8 },
  { name: 'Haryana', x: 570, y: 285, lat: 29.4, lng: 76.5 },
  { name: 'Uttarakhand', x: 505, y: 240, lat: 30.3, lng: 78.0 },
  { name: 'Uttar Pradesh', x: 600, y: 340, lat: 26.8, lng: 80.9 },
  { name: 'Bihar', x: 655, y: 395, lat: 25.1, lng: 85.3 },
  { name: 'Jharkhand', x: 675, y: 445, lat: 23.6, lng: 85.3 },
  { name: 'West Bengal', x: 730, y: 430, lat: 22.9, lng: 87.8 },
  { name: 'Sikkim', x: 705, y: 345, lat: 27.5, lng: 88.5 },
  { name: 'Arunachal Pradesh', x: 740, y: 250, lat: 27.1, lng: 93.6 },
  { name: 'Assam', x: 710, y: 380, lat: 26.1, lng: 92.9 },
  { name: 'Meghalaya', x: 695, y: 430, lat: 25.5, lng: 91.9 },
  { name: 'Odisha', x: 680, y: 495, lat: 20.5, lng: 85.8 },
  { name: 'Chhattisgarh', x: 600, y: 465, lat: 21.3, lng: 81.8 },
  { name: 'Madhya Pradesh', x: 530, y: 440, lat: 22.7, lng: 78.8 },
  { name: 'Rajasthan', x: 400, y: 325, lat: 26.9, lng: 73.9 },
  { name: 'Gujarat', x: 370, y: 345, lat: 22.3, lng: 70.8 },
  { name: 'Maharashtra', x: 445, y: 500, lat: 19.8, lng: 75.7 },
  { name: 'Goa', x: 415, y: 565, lat: 15.3, lng: 74.1 },
  { name: 'Karnataka', x: 485, y: 555, lat: 15.3, lng: 75.7 },
  { name: 'Kerala', x: 445, y: 645, lat: 10.0, lng: 76.3 },
  { name: 'Tamil Nadu', x: 565, y: 610, lat: 11.1, lng: 78.2 },
  { name: 'Andhra Pradesh', x: 615, y: 535, lat: 15.9, lng: 79.8 },
  { name: 'Telangana', x: 565, y: 485, lat: 17.4, lng: 78.5 },
];

export const EVENT_TYPES: EventType[] = [
  'Cyclone', 'Monsoon depression', 'Western disturbance', 'Heat wave', 'Active monsoon',
  'Break monsoon', 'Heavy rainfall', 'Monsoon trough', 'Fair weather',
];

/** How each weather regime perturbs the regional baseline, and how hard it is
 * to forecast. `rainErr`/`tempErr` scale the synthetic forecast error, and
 * `bias` < 0 means models historically under-forecast the peak. */
export const EVENT_PROFILES: Record<EventType, {
  rain: number; temp: number; wind: number; pressure: number; tendency: number;
  rainErr: number; tempErr: number; rainBias: number; tempBias: number; leadGrowth: number;
  description: string;
}> = {
  'Cyclone': { rain: 120, temp: -4, wind: 55, pressure: -14, tendency: 5, rainErr: 0.55, tempErr: 1.4, rainBias: -0.18, tempBias: 0, leadGrowth: 0.2,
    description: 'track and landfall-timing errors shift the heavy-rain swath between districts' },
  'Monsoon depression': { rain: 95, temp: -3, wind: 35, pressure: -8, tendency: 3, rainErr: 0.5, tempErr: 1.1, rainBias: -0.14, tempBias: 0, leadGrowth: 0.18,
    description: 'models misplace the westward-moving depression and its rain shield' },
  'Western disturbance': { rain: 38, temp: -5, wind: 28, pressure: -5, tendency: 3.5, rainErr: 0.62, tempErr: 1.7, rainBias: -0.05, tempBias: 0.3, leadGrowth: 0.19,
    description: 'upper-air trough timing and orographic enhancement are poorly resolved' },
  'Heat wave': { rain: 1, temp: 6, wind: 14, pressure: -1, tendency: 0.6, rainErr: 0.3, tempErr: 1.6, rainBias: 0, tempBias: -0.45, leadGrowth: 0.17,
    description: 'models under-forecast peak maximum temperature under persistent subsidence' },
  'Active monsoon': { rain: 70, temp: -3, wind: 30, pressure: -4, tendency: 1.5, rainErr: 0.38, tempErr: 0.9, rainBias: -0.06, tempBias: 0, leadGrowth: 0.14,
    description: 'embedded convective bursts produce localized extremes' },
  'Break monsoon': { rain: 8, temp: 2, wind: 12, pressure: 2, tendency: 1, rainErr: 0.9, tempErr: 1.1, rainBias: 0.25, tempBias: -0.2, leadGrowth: 0.16,
    description: 'models often revive monsoon rainfall too early during a break phase' },
  'Heavy rainfall': { rain: 125, temp: -2, wind: 22, pressure: -4, tendency: 2, rainErr: 0.52, tempErr: 1, rainBias: -0.16, tempBias: 0, leadGrowth: 0.16,
    description: 'orographic and mesoscale convective rainfall is under-resolved at model grid scale' },
  'Monsoon trough': { rain: 45, temp: -1, wind: 20, pressure: -3, tendency: 1.2, rainErr: 0.4, tempErr: 0.9, rainBias: -0.04, tempBias: 0, leadGrowth: 0.13,
    description: 'north-south oscillation of the trough axis moves the rain belt' },
  'Fair weather': { rain: 2, temp: 0, wind: 12, pressure: 0, tendency: 0.5, rainErr: 0.35, tempErr: 0.8, rainBias: 0, tempBias: 0, leadGrowth: 0.12,
    description: 'stable conditions are generally well forecast' },
};

/** June climatology for each state (24 h rainfall mm, Tmax °C, wind km/h, MSLP hPa).
 * The rainfall and temperature values here are fallbacks only: they are replaced below by the
 * observed IMD June means (rainfall and maximum temperature). Wind and pressure are still estimates. */
export const REGION_CLIMATOLOGY: Record<string, RegionClimatology> = {
  'Jammu & Kashmir': { rainfall: 4, temperature: 32, windSpeed: 12, pressure: 1003, events: { 'Western disturbance': 3, 'Fair weather': 2, 'Heavy rainfall': 1 } },
  'Himachal Pradesh': { rainfall: 5, temperature: 31, windSpeed: 11, pressure: 1004, events: { 'Western disturbance': 3, 'Heavy rainfall': 2, 'Fair weather': 1 } },
  'Punjab': { rainfall: 3, temperature: 41, windSpeed: 14, pressure: 999, events: { 'Heat wave': 3, 'Western disturbance': 2, 'Fair weather': 2, 'Monsoon trough': 1 } },
  'Haryana': { rainfall: 3, temperature: 42, windSpeed: 14, pressure: 999, events: { 'Heat wave': 3, 'Western disturbance': 1, 'Fair weather': 2, 'Monsoon trough': 1 } },
  'Uttarakhand': { rainfall: 8, temperature: 33, windSpeed: 10, pressure: 1003, events: { 'Western disturbance': 2, 'Heavy rainfall': 3, 'Monsoon trough': 1 } },
  'Uttar Pradesh': { rainfall: 5, temperature: 41, windSpeed: 13, pressure: 999, events: { 'Heat wave': 3, 'Monsoon depression': 2, 'Monsoon trough': 2, 'Break monsoon': 1 } },
  'Bihar': { rainfall: 10, temperature: 38, windSpeed: 12, pressure: 1000, events: { 'Monsoon depression': 2, 'Heat wave': 2, 'Monsoon trough': 2, 'Heavy rainfall': 1 } },
  'Jharkhand': { rainfall: 12, temperature: 37, windSpeed: 12, pressure: 1000, events: { 'Monsoon depression': 3, 'Heat wave': 1, 'Active monsoon': 2 } },
  'West Bengal': { rainfall: 18, temperature: 35, windSpeed: 14, pressure: 1000, events: { 'Cyclone': 2, 'Monsoon depression': 2, 'Active monsoon': 2, 'Heavy rainfall': 1 } },
  'Sikkim': { rainfall: 22, temperature: 25, windSpeed: 8, pressure: 1006, events: { 'Heavy rainfall': 3, 'Active monsoon': 2, 'Break monsoon': 1 } },
  'Arunachal Pradesh': { rainfall: 25, temperature: 28, windSpeed: 8, pressure: 1005, events: { 'Heavy rainfall': 3, 'Active monsoon': 2, 'Break monsoon': 1 } },
  'Assam': { rainfall: 22, temperature: 32, windSpeed: 10, pressure: 1002, events: { 'Heavy rainfall': 3, 'Active monsoon': 2, 'Break monsoon': 1 } },
  'Meghalaya': { rainfall: 30, temperature: 27, windSpeed: 10, pressure: 1004, events: { 'Heavy rainfall': 4, 'Active monsoon': 2 } },
  'Odisha': { rainfall: 14, temperature: 36, windSpeed: 15, pressure: 1000, events: { 'Cyclone': 2, 'Monsoon depression': 3, 'Active monsoon': 1, 'Heat wave': 1 } },
  'Chhattisgarh': { rainfall: 10, temperature: 38, windSpeed: 12, pressure: 1001, events: { 'Monsoon depression': 3, 'Heat wave': 1, 'Active monsoon': 1, 'Break monsoon': 1 } },
  'Madhya Pradesh': { rainfall: 6, temperature: 39, windSpeed: 14, pressure: 1000, events: { 'Monsoon depression': 2, 'Heat wave': 2, 'Break monsoon': 1, 'Monsoon trough': 1 } },
  'Rajasthan': { rainfall: 2, temperature: 43, windSpeed: 16, pressure: 998, events: { 'Heat wave': 4, 'Cyclone': 1, 'Monsoon trough': 1, 'Fair weather': 1 } },
  'Gujarat': { rainfall: 6, temperature: 38, windSpeed: 18, pressure: 1000, events: { 'Cyclone': 3, 'Heat wave': 1, 'Active monsoon': 2, 'Break monsoon': 1 } },
  'Maharashtra': { rainfall: 15, temperature: 34, windSpeed: 18, pressure: 1003, events: { 'Active monsoon': 3, 'Break monsoon': 2, 'Cyclone': 1, 'Monsoon depression': 1 } },
  'Goa': { rainfall: 40, temperature: 30, windSpeed: 20, pressure: 1005, events: { 'Active monsoon': 3, 'Break monsoon': 2, 'Cyclone': 1 } },
  'Karnataka': { rainfall: 18, temperature: 31, windSpeed: 20, pressure: 1006, events: { 'Active monsoon': 3, 'Break monsoon': 2, 'Fair weather': 1 } },
  'Kerala': { rainfall: 35, temperature: 30, windSpeed: 18, pressure: 1006, events: { 'Active monsoon': 3, 'Break monsoon': 2, 'Heavy rainfall': 1 } },
  'Tamil Nadu': { rainfall: 3, temperature: 37, windSpeed: 18, pressure: 1004, events: { 'Cyclone': 2, 'Fair weather': 2, 'Break monsoon': 1 } },
  'Andhra Pradesh': { rainfall: 5, temperature: 38, windSpeed: 16, pressure: 1002, events: { 'Cyclone': 3, 'Heat wave': 1, 'Monsoon depression': 1 } },
  'Telangana': { rainfall: 6, temperature: 39, windSpeed: 14, pressure: 1002, events: { 'Monsoon depression': 2, 'Heat wave': 2, 'Break monsoon': 1 } },
};

for (const [name, climate] of Object.entries(REGION_CLIMATOLOGY)) {
  const june = observedMonthly(name, 6);
  if (june) climate.rainfall = june.mean;
  const juneTmax = observedTmaxMonthly(name, 6);
  if (juneTmax) climate.temperature = juneTmax.mean;
}

/** Scales regime rainfall to how wet a region is climatologically. */
export function wetness(region: string) {
  const base = REGION_CLIMATOLOGY[region]?.rainfall ?? 10;
  return Math.min(1.5, Math.max(0.55, (base + 20) / 32));
}
