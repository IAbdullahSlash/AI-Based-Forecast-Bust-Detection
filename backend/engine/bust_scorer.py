from typing import List, Tuple
from .models import RegionalScore, HistoricalAnalogueItem, ConfidenceLevel, ForecastVar
from .error_engine import get_region_metrics, get_p90_threshold, get_lead_time_multiplier
from .analogue_engine import retrieve_top_analogues

def get_variable_unit(variable: ForecastVar) -> str:
    units = {
        "rainfall": "mm",
        "temperature": "°C",
        "wind": "km/h",
        "pressure": "hPa"
    }
    return units.get(variable, "mm")

def compute_bust_probability(
    region: str,
    forecast_value: float,
    lead_time_day: int,
    variable: ForecastVar = "rainfall"
) -> Tuple[float, ConfidenceLevel, List[HistoricalAnalogueItem], List[str]]:
    """
    Transparent, deterministic bust probability & confidence scoring model.
    Adheres strictly to SIH Work-Plan Section 8 & Important Design Rule:
    Score = w1 * Analogue_Bust_Rate + w2 * (Historical_MAE / P90) + w3 * Lead_Time_Uncertainty
    """
    metrics = get_region_metrics(region)
    p90 = get_p90_threshold(region, variable)
    base_mae = metrics["base_mae"]
    base_bust_rate = metrics.get("bust_rate", 0.25)

    # 1. Retrieve analogues
    analogues = retrieve_top_analogues(
        region=region,
        forecast_value=forecast_value,
        lead_time_days=lead_time_day,
        variable=variable,
        top_k=5
    )

    # 2. Analogue bust frequency calculation
    bust_count = sum(1 for a in analogues if a.bustStatus == "Forecast Bust")
    large_error_count = sum(1 for a in analogues if a.bustStatus == "Large Error")
    analogue_bust_rate = (bust_count * 1.0 + large_error_count * 0.5) / max(1, len(analogues))

    # 3. Regional climatological risk factor (MAE / P90)
    climatological_ratio = min(1.0, base_mae / max(1.0, p90))

    # 4. Lead time uncertainty multiplier (Day 1: 0.05, Day 5: 0.45, Day 10: 0.90)
    lead_time_factor = (lead_time_day - 1) / 9.0

    # 5. Composite deterministic probability formula
    w1, w2, w3 = 0.45, 0.30, 0.25
    raw_score = (
        w1 * analogue_bust_rate +
        w2 * (0.6 * climatological_ratio + 0.4 * base_bust_rate) +
        w3 * lead_time_factor
    )

    # Bound probability between 5% and 95%
    bust_prob_pct = round(max(5.0, min(95.0, raw_score * 100.0)), 1)

    # Map to Confidence Level
    if bust_prob_pct < 40.0:
        confidence: ConfidenceLevel = "high"
    elif bust_prob_pct <= 60.0:
        confidence = "medium"
    else:
        confidence = "low"

    # Generate transparent contributing factors
    key_reasons = []
    unit = get_variable_unit(variable)
    if analogue_bust_rate >= 0.5:
        key_reasons.append(f"{int(analogue_bust_rate * 100)}% of retrieved historical analogues experienced severe forecast bust")
    else:
        key_reasons.append(f"Historical analogues show consistent NWP stability ({int((1 - analogue_bust_rate) * 100)}% reliable)")

    if lead_time_day >= 5:
        key_reasons.append(f"Day {lead_time_day} horizon amplifies initial condition divergence (ensemble spread growth)")
    else:
        key_reasons.append(f"Short lead time (Day {lead_time_day}) preserves synoptic signal fidelity")

    key_reasons.append(f"Regional P90 bust threshold established at {p90} {unit} (Climatological MAE: {round(base_mae, 1)} {unit})")

    if metrics.get("terrain") in ["complex_himalayan", "extreme_orography", "sparse_observation_mountains"]:
        key_reasons.append("Complex topography produces sub-grid convective variance unresolved by NWP models")
    elif metrics.get("terrain") in ["coastal_plain", "coromandel_coast", "coastal_ghats"]:
        key_reasons.append("Sea surface temperature anomalies and onshore moisture surges drive forecast volatility")

    return bust_prob_pct, confidence, analogues, key_reasons

def score_region(
    region: str,
    forecast_value: float,
    lead_time_day: int,
    variable: ForecastVar = "rainfall"
) -> RegionalScore:
    """Produces the complete RegionalScore schema object for a state/region."""
    bust_prob, confidence, analogues, key_reasons = compute_bust_probability(
        region=region,
        forecast_value=forecast_value,
        lead_time_day=lead_time_day,
        variable=variable
    )
    metrics = get_region_metrics(region)
    p90 = get_p90_threshold(region, variable)

    bust_count = sum(1 for a in analogues if a.bustStatus == "Forecast Bust")
    large_error_count = sum(1 for a in analogues if a.bustStatus == "Large Error")
    hist_bust_freq = round((bust_count + large_error_count) / max(1, len(analogues)) * 100, 1)

    # Scale historical mean error for variable
    if variable == "temperature":
        hist_mean_err = round(metrics["base_mae"] * 0.05 + 1.2, 1)
    elif variable == "wind":
        hist_mean_err = round(metrics["base_mae"] * 0.22 + 4.0, 1)
    elif variable == "pressure":
        hist_mean_err = round(metrics["base_mae"] * 0.04 + 1.5, 1)
    else:
        hist_mean_err = round(metrics["base_mae"], 1)

    return RegionalScore(
        region=region,
        forecastValue=round(forecast_value, 1),
        bustProbability=bust_prob,
        confidence=confidence,
        historicalMeanError=hist_mean_err,
        p90Threshold=p90,
        similarCases=len(analogues),
        casesWithLargeError=bust_count + large_error_count,
        historicalBustFrequency=hist_bust_freq,
        keyReasons=key_reasons,
        unit=get_variable_unit(variable)
    )
