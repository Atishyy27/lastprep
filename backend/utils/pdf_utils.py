# backend/utils/pdf_utils.py
import fitz  # PyMuPDF
from fastapi import UploadFile

async def extract_text_from_pdf(file: UploadFile) -> str:
    """
    Read a PDF UploadFile and extract its full text asynchronously.
    """
    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = "".join(page.get_text() for page in doc)
    doc.close()
    return text
