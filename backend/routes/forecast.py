from fastapi import APIRouter, Query
from typing import Dict
from ..engine.models import ConfidenceMapResponse, ForecastVar, RegionalScore
from ..engine.bust_scorer import score_region
from ..engine.error_engine import REGIONAL_CLIMATOLOGY

router = APIRouter(prefix="/api", tags=["Forecast"])

# Baseline deterministic regional forecasts
BASE_FORECASTS = {
    "Odisha": 140.0, "Assam": 90.0, "Kerala": 155.0, "Meghalaya": 88.0,
    "West Bengal": 95.0, "Bihar": 85.0, "Jharkhand": 82.0, "Maharashtra": 120.0,
    "Gujarat": 60.0, "Rajasthan": 55.0, "Uttar Pradesh": 78.0, "Uttarakhand": 55.0,
    "Himachal Pradesh": 62.0, "Jammu & Kashmir": 45.0, "Ladakh": 12.0, "Punjab": 38.0,
    "Haryana": 42.0, "Delhi": 48.0, "Madhya Pradesh": 95.0, "Chhattisgarh": 110.0,
    "Goa": 98.0, "Karnataka": 105.0, "Tamil Nadu": 115.0, "Andhra Pradesh": 100.0,
    "Telangana": 95.0, "Sikkim": 58.0, "Arunachal Pradesh": 72.0, "Manipur": 76.0,
    "Mizoram": 82.0, "Tripura": 79.0, "Nagaland": 68.0, "Puducherry": 88.0
}

def get_forecast_for_day_and_var(region: str, day: int, variable: ForecastVar) -> float:
    base = BASE_FORECASTS.get(region, 70.0)
    # Day variation
    day_offset = (day - 1) * 2.5

    if variable == "temperature":
        if region in ["Rajasthan", "Gujarat"]:
            return round(38.0 + (base % 5) + (day * 0.4), 1)
        elif region in ["Ladakh", "Jammu & Kashmir", "Himachal Pradesh", "Uttarakhand", "Sikkim"]:
            return round(18.0 + (base % 7) + (day * 0.2), 1)
        return round(32.0 + (base % 6) + (day * 0.3), 1)
    elif variable == "wind":
        if region in ["Odisha", "West Bengal", "Gujarat", "Kerala", "Goa", "Maharashtra", "Tamil Nadu", "Andhra Pradesh"]:
            return round(32.0 + (base % 18) + (day * 0.8), 1)
        return round(18.0 + (base % 12) + (day * 0.5), 1)
    elif variable == "pressure":
        return round(1006.0 + (base % 8) - (day * 0.3), 1)
    else:  # rainfall
        return round(base * (0.85 + (day % 3) * 0.1) + day_offset, 1)

@router.get("/confidence-map", response_model=ConfidenceMapResponse)
def get_confidence_map(
    day: int = Query(default=1, ge=1, le=10, description="Lead time in days (1 to 10)"),
    variable: ForecastVar = Query(default="rainfall", description="Forecast variable")
):
    regions_data: Dict[str, RegionalScore] = {}
    high_count, med_count, low_count = 0, 0, 0

    for region in REGIONAL_CLIMATOLOGY.keys():
        f_val = get_forecast_for_day_and_var(region, day, variable)
        score = score_region(region, f_val, day, variable)
        regions_data[region] = score

        if score.confidence == "high":
            high_count += 1
        elif score.confidence == "medium":
            med_count += 1
        else:
            low_count += 1

    return ConfidenceMapResponse(
        day=day,
        variable=variable,
        regions=regions_data,
        summary={
            "regionsAnalyzed": len(regions_data),
            "highConfidence": high_count,
            "mediumConfidence": med_count,
            "lowConfidence": low_count
        }
    )
