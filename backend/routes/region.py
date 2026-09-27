from fastapi import APIRouter, HTTPException, Query
from ..engine.models import RegionalScore, ForecastVar
from ..engine.bust_scorer import score_region
from ..engine.error_engine import REGIONAL_CLIMATOLOGY
from .forecast import get_forecast_for_day_and_var

router = APIRouter(prefix="/api", tags=["Regions"])

@router.get("/regions/{region_name}", response_model=RegionalScore)
def get_region_detail(
    region_name: str,
    day: int = Query(default=1, ge=1, le=10),
    variable: ForecastVar = Query(default="rainfall")
):
    # Match region name case-insensitively or return default
    matched = None
    for r in REGIONAL_CLIMATOLOGY.keys():
        if r.lower() == region_name.lower():
            matched = r
            break

    if not matched:
        matched = "Odisha"  # fallback

    f_val = get_forecast_for_day_and_var(matched, day, variable)
    return score_region(matched, f_val, day, variable)
