"""
FastAPI Application Entry Point for PharmaForm AI
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.predict import run_compatibility_prediction
from backend.rdkit_utils import compute_rdkit_descriptors

app = FastAPI(
    title="PharmaForm AI API",
    description="AI-Powered Drug–Excipient Compatibility Prediction Platform",
    version="1.0.0"
)

class PredictRequest(BaseModel):
    drug: Dict[str, Any]
    excipient: Dict[str, Any]

@app.get("/")
def read_root():
    return {"status": "PharmaForm AI FastAPI Backend Active"}

@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    return run_compatibility_prediction(req.drug, req.excipient)

@app.get("/history")
def get_history_endpoint():
    return []

@app.post("/upload")
def upload_sdf_endpoint(file_content: str):
    return {"message": "Parsed successfully", "content_length": len(file_content)}
