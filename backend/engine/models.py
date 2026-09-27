from typing import Literal, List, Dict, Optional
from pydantic import BaseModel, Field

ConfidenceLevel = Literal["high", "medium", "low"]
ForecastVar = Literal["rainfall", "temperature", "wind", "pressure"]
BustStatus = Literal["Forecast Bust", "Large Error", "Normal"]

class RegionalScore(BaseModel):
    region: str
    forecastValue: float
    bustProbability: float
    confidence: ConfidenceLevel
    historicalMeanError: float
    p90Threshold: float
    similarCases: int
    casesWithLargeError: int
    historicalBustFrequency: float
    keyReasons: List[str]
    unit: str

class HistoricalAnalogueItem(BaseModel):
    eventType: str
    region: str
    date: str
    similarity: float
    forecastError: float
    bustStatus: BustStatus
    unit: str

class ConfidenceMapResponse(BaseModel):
    day: int
    variable: ForecastVar
    regions: Dict[str, RegionalScore]
    summary: Dict[str, int]

class CaseStudyStep(BaseModel):
    stepIndex: int
    title: str
    timestamp: str
    description: str
    data: Dict[str, float | str | int | List[str]]

class CaseStudy(BaseModel):
    id: str
    title: str
    subtitle: str
    date: str
    targetRegion: str
    variable: ForecastVar
    leadTimeDays: int
    nwpForecastValue: float
    observedValue: float
    actualError: float
    p90Threshold: float
    bustProbability: float
    confidence: ConfidenceLevel
    wasBust: bool
    topAnalogues: List[HistoricalAnalogueItem]
    geminiMeteorologicalContext: str
    verificationSummary: Dict[str, float | str]
    timelineSteps: List[CaseStudyStep]

class EvaluationMetrics(BaseModel):
    precision: float
    recall: float
    f1Score: float
    brierScore: float
    detectionLeadTimeDays: float
    sampleEventsCount: int
    p90ThresholdSummary: Dict[str, float]
