import numpy as np
from typing import List, Dict

TERRAIN_WEIGHTS = {
    "cold_desert": 0.1,
    "desert_semiarid": 0.2,
    "plains": 0.25,
    "plains_irrigated": 0.25,
    "urban_plain": 0.35,
    "gangetic_plain": 0.35,
    "gangetic_delta": 0.45,
    "central_plateau": 0.4,
    "forested_plateau": 0.45,
    "plateau": 0.45,
    "deccan_plateau": 0.45,
    "coastal_enclave": 0.5,
    "coastal_plain": 0.55,
    "arid_coastal": 0.5,
    "coromandel_coast": 0.6,
    "coastal_ghats": 0.7,
    "ghats_coast": 0.75,
    "ghats_plateau": 0.7,
    "lowland_border": 0.4,
    "valley_shielded": 0.5,
    "valley_hills": 0.65,
    "hill_valleys": 0.7,
    "rugged_ridge": 0.75,
    "naga_hills": 0.75,
    "eastern_himalayan": 0.85,
    "complex_himalayan": 0.9,
    "sparse_observation_mountains": 0.95,
    "extreme_orography": 1.0,
    "general": 0.5
}

def extract_fingerprint(
    forecast_value: float,
    lead_time_days: int,
    variable: str,
    terrain_type: str = "general",
    pressure_anomaly_hpa: float = -4.0,
    wind_speed_kmh: float = 25.0,
    month: int = 7  # July (peak southwest monsoon)
) -> np.ndarray:
    """
    Constructs a 6-dimensional normalized meteorological fingerprint vector:
    [Norm_Value, Lead_Time, Pressure_Trough_Strength, Wind_Gradient, Orography, Monsoon_Seasonality]
    """
    # 1. Normalized Value (relative to typical variable scale)
    if variable == "rainfall":
        norm_val = min(1.0, forecast_value / 200.0)
    elif variable == "temperature":
        norm_val = min(1.0, max(0.0, (forecast_value - 10.0) / 40.0))
    elif variable == "wind":
        norm_val = min(1.0, forecast_value / 80.0)
    else:  # pressure
        norm_val = min(1.0, max(0.0, (1020.0 - forecast_value) / 40.0))

    # 2. Lead Time Factor (0.1 to 1.0)
    lead_factor = lead_time_days / 10.0

    # 3. Barometric Trough Depth (-15 hPa = extreme deep depression, 0 = neutral)
    pressure_trough = min(1.0, max(0.0, abs(min(0.0, pressure_anomaly_hpa)) / 15.0))

    # 4. Wind Dynamics
    wind_factor = min(1.0, wind_speed_kmh / 70.0)

    # 5. Orographic Complexity Index
    terrain_idx = TERRAIN_WEIGHTS.get(terrain_type, 0.5)

    # 6. Monsoon Seasonality Harmonic (peaks in July/August: month 7 & 8)
    seasonality = np.sin((month - 1) * np.pi / 6.0)
    seasonality_norm = float(0.5 + 0.5 * seasonality)

    return np.array([
        norm_val,
        lead_factor,
        pressure_trough,
        wind_factor,
        terrain_idx,
        seasonality_norm
    ], dtype=float)

def compute_similarity(f1: np.ndarray, f2: np.ndarray) -> float:
    """
    Calculates percentage similarity (0 to 100%) using weighted Euclidean distance.
    Distance of 0.0 -> 100% similarity.
    """
    weights = np.array([0.30, 0.15, 0.20, 0.15, 0.10, 0.10], dtype=float)
    diff = (f1 - f2) * np.sqrt(weights)
    dist = float(np.linalg.norm(diff))
    # Map distance: dist=0 -> 100%, dist>=1.0 -> 0%
    sim = max(0.0, min(100.0, (1.0 - dist) * 100.0))
    return round(sim, 1)
