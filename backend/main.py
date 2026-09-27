import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.forecast import router as forecast_router
from .routes.region import router as region_router
from .routes.analogues import router as analogues_router
from .routes.case_study import router as case_study_router
from .routes.metrics import router as metrics_router

app = FastAPI(
    title="AI-Based Forecast Bust Detection Engine",
    description="Operational hybrid model calculating forecast bust probabilities, retrieving analogues, and powering the SIH prototype.",
    version="1.0.0"
)

# Enable CORS for React Vite frontend (port 5173 or any dev origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(forecast_router)
app.include_router(region_router)
app.include_router(analogues_router)
app.include_router(case_study_router)
app.include_router(metrics_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Forecast Bust Detection Engine",
        "version": "1.0.0",
        "dataset": "IMD/ERA5 Calibrated Climatology (2018-2023)",
        "p90_bust_definition": "Active",
        "analogues_count": 32
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
