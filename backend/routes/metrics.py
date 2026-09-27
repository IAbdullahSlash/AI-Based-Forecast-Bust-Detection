from fastapi import APIRouter
from ..engine.models import EvaluationMetrics
from ..engine.case_study_data import BENCHMARK_EVALUATION

router = APIRouter(prefix="/api", tags=["Evaluation"])

@router.get("/evaluation", response_model=EvaluationMetrics)
def get_evaluation_metrics():
    return BENCHMARK_EVALUATION
