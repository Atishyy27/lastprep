# backend/api/cv_parser.py
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, List
from utils.pdf_utils import extract_text_from_pdf

router = APIRouter()

def parse_cv_into_sections(cv_text: str) -> Dict[str, List[Dict[str, str]]]:
    """
    Parse CV text into structured sections like projects and experience.
    """
    normalized_text = cv_text.replace('\r\n', '\n')
    sections_to_parse = {
        "projects": r'PROJECTS?\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)',
        "experience": r'EXPERIENCE\n(.*?)(?=\n[A-Z\s]{5,}\n|\Z)'
    }
    parsed_sections = {"projects": [], "experience": []}
    for section_name, pattern in sections_to_parse.items():
        match = re.search(pattern, normalized_text, re.DOTALL | re.IGNORECASE)
        if not match:
            continue
        content = match.group(1).strip()
        items = re.split(r'\n(?=[A-Z][a-zA-Z\s]+\s*\||\n[A-Z][a-zA-Z\s]+ at)', content)
        if len(items) <= 1 and '\n\n' in content:
            items = [p.strip() for p in content.split('\n\n') if p.strip()]
        for item_text in items:
            if not item_text.strip():
                continue
            first_line = item_text.split('\n')[0].strip()
            title = first_line.split('|')[0].strip() if '|' in first_line else first_line
            parsed_sections[section_name].append({"title": title, "text": item_text.strip()})
    return parsed_sections

@router.post("/parse")
async def parse_cv(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Invalid file type. Please upload a PDF.")

    try:
        cv_text = await extract_text_from_pdf(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF text: {str(e)}")

    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF.")

    parsed = parse_cv_into_sections(cv_text)
    if not any(parsed.values()):
        raise HTTPException(status_code=422, detail="No recognizable sections found in CV.")

    return parsed
