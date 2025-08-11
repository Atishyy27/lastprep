# File: backend/app/models.py

from pydantic import BaseModel, Field
from typing import List, Dict, Any

# --- Request Models ---
class Section(BaseModel):
    title: str
    text: str

class InterviewRequest(BaseModel):
    section: Section
    history: List[Dict[str, str]] = Field(default_factory=list)

# --- Response Models ---
class CvSectionItem(BaseModel):
    title: str
    text: str

class CvSections(BaseModel):
    projects: List[CvSectionItem]
    experience: List[CvSectionItem]

class AnalysisFundametals(BaseModel):
    technology: str
    explanation: str
    talking_points: List[str]
    common_question: Dict[str, str]

class AnalysisResponse(BaseModel):
    fundamentals: List[AnalysisFundametals]

class InterviewResponse(BaseModel):
    feedback: str | None = None
    next_question: str
