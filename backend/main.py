"""
backend/main.py
----------------
FastAPI backend for CV parsing, mock interview, and quick review.
Production-ready with modular parsing, async calls, and error handling.
"""

import os
import re
import json
import logging
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

# Load environment variables securely
load_dotenv()

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CV Parsing & Mock Interview API")

# Configure CORS for frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        # add production frontend URLs here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request validation
class Section(BaseModel):
    title: str
    text: str

class HistoryTurn(BaseModel):
    question: Optional[str]
    answer: Optional[str]
    feedback: Optional[str] = None

class InterviewRequest(BaseModel):
    section: Section
    history: List[HistoryTurn] = Field(default_factory=list)

# --- PDF parsing helper function ---
def extract_sections(cv_text: str) -> Dict[str, List[Dict[str, str]]]:
    """
    Extract CV sections such as projects, experience, education, skills, extracurricular, etc.
    Uses regex-based heuristics for flexibility.

    Returns:
        Dictionary of section name -> list of {title, text} entries.
    """
    # Normalize line endings
    text = cv_text.replace('\r\n', '\n')
    
    # Define section headers with regex patterns; can be extended
    patterns = {
        "projects": r'PROJECTS?\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)',
        "experience": r'EXPERIENCE\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)',
        "education": r'EDUCATION\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)',
        "skills": r'SKILLS?\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)',
        "extracurricular": r'(EXTRA-?CURRICULAR|ACTIVITIES|POSITIONS?)\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)'
    }

    sections = {}
    for section, pattern in patterns.items():
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if not match:
            sections[section] = []
            continue
        content = match.group(1).strip()

        # Split content into items based on newlines, bullet points, or lines starting with capitalized words
        items = re.split(r'\n(?=[A-Z][a-zA-Z\s]+\s*\||\n[A-Z][a-zA-Z\s]+ at|^\s*-\s*)', content)
        if len(items) <= 1 and '\n\n' in content:
            items = [p.strip() for p in content.split('\n\n') if p.strip()]

        entries = []
        for item in items:
            if not item.strip():
                continue
            first_line = item.split('\n')[0].strip()
            title = first_line.split('|')[0].strip() if '|' in first_line else first_line
            entries.append({"title": title, "text": item.strip()})
        sections[section] = entries
    return sections

# --- API Endpoints ---

@app.post("/parse-cv", summary="Parse CV PDF and extract structured sections")
async def parse_cv(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    
    try:
        import fitz  # PyMuPDF
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        cv_text = "".join(page.get_text() for page in doc)
        doc.close()
        if not cv_text.strip():
            raise HTTPException(status_code=400, detail="Extracted text from PDF is empty.")
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

    sections = extract_sections(cv_text)
    logger.info(f"Parsed CV sections: {list(sections.keys())}")
    return sections

@app.post("/mock-interview", summary="Generate mock interview questions and feedback")
async def mock_interview(req: InterviewRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY missing")
        raise HTTPException(status_code=500, detail="AI API key not configured.")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
    history_payload = []

    # Prepare conversational history for AI prompt
    for turn in req.history:
        if turn.question:
            history_payload.append({"role": "model", "parts": [{"text": turn.question}]})
        if turn.answer:
            history_payload.append({"role": "user", "parts": [{"text": turn.answer}]})

    # Construct prompt depending on state (first question or follow-up)
    if not req.history:
        prompt = (
            f"You are a senior technical interviewer. "
            f"Project Title: '{req.section.title}', Description: '{req.section.text}'. "
            f"Ask the first open-ended question. Respond ONLY with JSON: "
            '{"next_question": "Your question here."}'
        )
        contents = [{"parts": [{"text": prompt}]}]
    else:
        last_answer = req.history[-1].answer or ""
        prompt = (
            f"You are a senior technical interviewer. "
            f"Project: '{req.section.title}'. Candidate's last answer: '{last_answer}'. "
            f"Provide a JSON with 'feedback' (brief, constructive) and 'next_question' (follow-up)."
        )
        history_payload.append({"role": "user", "parts": [{"text": prompt}]})
        contents = history_payload

    payload = {
        "contents": contents,
        "generationConfig": {"response_mime_type": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            result = resp.json()
            raw_text = result["candidates"][0]["content"]["parts"][0]["text"]

            # Robust JSON extraction from response
            try:
                return json.loads(raw_text)
            except json.JSONDecodeError:
                match = re.search(r"```json\n(.*)\n```", raw_text, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
                raise HTTPException(status_code=500, detail="Malformed AI JSON response.")
    except httpx.HTTPStatusError as e:
        logger.error(f"AI API HTTP error: {e.response.text}")
        raise HTTPException(status_code=502, detail="AI service returned error.")
    except Exception as e:
        logger.error(f"Unexpected error in mock interview endpoint: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error.")

@app.post("/quick-review", summary="Generate quick review bullet points for a CV section")
async def quick_review(req: Section):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI API key not configured.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"

    prompt = (
        f"Given the following CV section title and content, "
        f"generate 5 concise bullet points summarizing key facts or concepts for quick review.\n\n"
        f"Title: {req.title}\n\nContent:\n{req.text}\n\n"
        "Return the response as a JSON array of strings."
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            result = resp.json()
            raw_text = result["candidates"][0]["content"]["parts"][0]["text"]

            try:
                points = json.loads(raw_text)
                if not isinstance(points, list):
                    raise ValueError("Response is not a JSON list")
                return {"points": points}
            except Exception:
                # fallback: parse markdown list bullets if AI doesn't return clean JSON
                bullets = re.findall(r"^\s*[-*]\s+(.*)$", raw_text, re.MULTILINE)
                return {"points": bullets or [raw_text]}
    except Exception as e:
        logger.error(f"Quick review generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quick review.")

@app.get("/", summary="Health check endpoint")
def health_check():
    return {"status": "ok"}
