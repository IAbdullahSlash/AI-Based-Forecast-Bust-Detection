from fastapi import APIRouter, Query
from typing import List
from ..engine.models import HistoricalAnalogueItem, ForecastVar
from ..engine.analogue_engine import retrieve_top_analogues
from .forecast import get_forecast_for_day_and_var

router = APIRouter(prefix="/api", tags=["Analogues"])

@router.get("/analogues", response_model=List[HistoricalAnalogueItem])
def get_historical_analogues(
    region: str = Query(default="Odisha"),
    day: int = Query(default=1, ge=1, le=10),
    variable: ForecastVar = Query(default="rainfall"),
    top_k: int = Query(default=5, ge=1, le=10)
):
    f_val = get_forecast_for_day_and_var(region, day, variable)
    return retrieve_top_analogues(
        region=region,
        forecast_value=f_val,
        lead_time_days=day,
        variable=variable,
        top_k=top_k
    )
