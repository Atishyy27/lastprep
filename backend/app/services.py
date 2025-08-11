# File: backend/app/services.py

import re
import spacy
from spacy.matcher import Matcher
import httpx
from typing import Dict, List

# Load the spaCy model once when the service starts
nlp = spacy.load("en_core_web_sm")

def parse_cv_with_spacy(cv_text: str) -> Dict[str, List[Dict[str, str]]]:
    """
    Parses CV text into structured sections using spaCy's rule-based Matcher.
    This is much more reliable than complex regex for finding section headers.
    """
    doc = nlp(cv_text.replace('\r\n', '\n'))
    matcher = Matcher(nlp.vocab)

    # Define patterns for different ways people write section headers
    project_patterns = [
        [{"LOWER": "projects"}],
        [{"LOWER": "personal"}, {"LOWER": "projects"}],
        [{"LOWER": "publications"}]
    ]
    experience_patterns = [
        [{"LOWER": "experience"}],
        [{"LOWER": "work"}, {"LOWER": "experience"}],
        [{"LOWER": "employment"}]
    ]

    matcher.add("PROJECTS", project_patterns)
    matcher.add("EXPERIENCE", experience_patterns)

    matches = matcher(doc)
    
    # Sort matches by their start position in the document
    matches.sort(key=lambda x: x[1])

    parsed_sections = {"projects": [], "experience": []}
    
    for i, match in enumerate(matches):
        match_id, start_token, end_token = match
        section_name_str = nlp.vocab.strings[match_id]
        
        # Determine the span of the section's content
        section_start = end_token
        section_end = len(doc)
        if i + 1 < len(matches):
            next_match_start = matches[i+1][1]
            section_end = next_match_start
            
        section_content = doc[section_start:section_end].text.strip()
        
        # Now, split the content of this section into individual items
        items_text = re.split(r'\n(?=[A-Z][a-zA-Z\s]+\s*\||\n[A-Z][a-zA-Z\s]+ at|\n\n)', section_content)
        
        for item_text in items_text:
            if not item_text.strip():
                continue
            
            first_line = item_text.split('\n')[0].strip()
            title = first_line.split('|')[0].strip() if '|' in first_line else first_line
            
            if section_name_str == "PROJECTS":
                parsed_sections["projects"].append({"title": title, "text": item_text.strip()})
            elif section_name_str == "EXPERIENCE":
                parsed_sections["experience"].append({"title": title, "text": item_text.strip()})

    return parsed_sections


async def get_mock_interview_response(api_key: str, section: dict, history: list, client: httpx.AsyncClient) -> dict:
    """
    Handles the logic for the mock interview AI call.
    """
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
    
    history_for_ai = []
    # Simplified history for this example
    # A production app might need a more complex history management
    if history:
         last_turn = history[-1]
         history_for_ai.append({"role": "user", "parts": [{"text": last_turn.get("question")}]})
         history_for_ai.append({"role": "model", "parts": [{"text": last_turn.get("answer")}]})
    
    if not history:
        prompt = f"""
        You are a senior technical interviewer. You are about to interview a candidate about their project.
        Project Title: "{section['title']}"
        Project Description: "{section['text']}"
        Your task is to ask the candidate's first question. Make it a broad, open-ended question like "Can you walk me through this project?".
        Respond with a JSON object with a single key "next_question". Example: {{"next_question": "Your question here."}}
        """
        history_for_ai.append({"role": "user", "parts": [{"text": prompt}]})
    else:
        last_answer = history[-1].get("answer")
        prompt = f"""
        You are a senior technical interviewer interviewing a candidate about their project: "{section['title']}".
        The candidate's last answer was: "{last_answer}".
        Your task is to provide two things in a JSON object:
        1. "feedback": Short, constructive feedback on their answer.
        2. "next_question": Your relevant follow-up question.
        """
        history_for_ai.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {"contents": history_for_ai, "generationConfig": {"response_mime_type": "application/json"}}
    
    response = await client.post(api_url, json=payload, timeout=90.0)
    response.raise_for_status()
    import json
    return json.loads(response.json()['candidates'][0]['content']['parts'][0]['text'])

