from fastapi import APIRouter, HTTPException
from typing import List
from ..engine.models import CaseStudy
from ..engine.case_study_data import CASE_STUDIES

router = APIRouter(prefix="/api", tags=["Case Studies"])

@router.get("/case-studies", response_model=List[CaseStudy])
def list_case_studies():
    return list(CASE_STUDIES.values())

@router.get("/case-studies/{case_id}", response_model=CaseStudy)
def get_case_study(case_id: str):
    if case_id not in CASE_STUDIES:
        raise HTTPException(status_code=404, detail="Case study not found")
    return CASE_STUDIES[case_id]
