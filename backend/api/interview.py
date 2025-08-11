# backend/api/interview.py
import os
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
from utils.ai_client import GeminiClient

router = APIRouter()

gemini_client = GeminiClient(api_key=os.getenv("GEMINI_API_KEY"))

class Section(BaseModel):
    title: str
    text: str

class InterviewRequest(BaseModel):
    section: Section
    history: List[Dict[str, str | None]] = Field(default_factory=list)

@router.post("/mock")
async def mock_interview(request: InterviewRequest):
    if not gemini_client.api_key:
        raise HTTPException(status_code=500, detail="AI API key not configured.")

    history_for_ai = []
    for turn in request.history:
        if turn.get("question"):
            history_for_ai.append({"role": "model", "parts": [{"text": turn.get("question")} ]})
        if turn.get("answer"):
            history_for_ai.append({"role": "user", "parts": [{"text": turn.get("answer")}]})

    if not request.history:
        prompt = (
            f'You are a senior technical interviewer... Project Title: "{request.section.title}", '
            f'Description: "{request.section.text}". Ask the first broad, open-ended question. '
            'Respond ONLY with a JSON object: {"next_question": "Your question here."}'
        )
        payload = [{"parts": [{"text": prompt}]}]
    else:
        last_answer = request.history[-1].get("answer")
        prompt = (
            f'You are a senior technical interviewer... Project: "{request.section.title}". '
            f'The candidate\'s last answer was: "{last_answer}". Provide a JSON object with "feedback" and "next_question".'
        )
        history_for_ai.append({"role": "user", "parts": [{"text": prompt}]})
        payload = history_for_ai

    try:
        response_text = await gemini_client.generate_content(payload)
        # Robust JSON parsing: try direct parse, else extract markdown JSON block
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            match = re.search(r"```json\n(.*)\n```", response_text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            raise HTTPException(status_code=500, detail="Malformed AI JSON response.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")
