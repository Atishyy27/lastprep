# File: backend/app/api.py

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi_cache.decorator import cache
import fitz  # PyMuPDF
import os
from . import models, services

router = APIRouter()

def get_api_key():
    """Dependency to get API key from environment variables."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured on server.")
    return api_key

@router.post("/parse-cv", response_model=models.CvSections)
async def parse_cv_endpoint(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    try:
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        cv_text = "".join(page.get_text() for page in doc)
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF file: {e}")

    if not cv_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
        
    return services.parse_cv_with_spacy(cv_text)

@router.post("/mock-interview")
async def mock_interview_endpoint(request: models.InterviewRequest, api_key: str = Depends(get_api_key)):
    """Handles the mock interview conversation."""
    import httpx
    async with httpx.AsyncClient() as client:
        return await services.get_mock_interview_response(api_key, request.section.dict(), request.history, client)

