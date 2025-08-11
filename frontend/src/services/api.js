// src/services/api.js

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Uploads a PDF file and gets the parsed sections.
 * @param {File} file - The PDF file to upload.
 * @returns {Promise<object>} The parsed CV sections.
 */
export const parseCvApi = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/parse-cv`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse CV.');
    }
    return response.json();
};

/**
 * Gets the AI-powered analysis for a specific section.
 * @param {object} section - The section object containing title and text.
 * @param {Array} history - The conversation history.
 * @returns {Promise<object>} The AI's feedback and next question.
 */
export const mockInterviewApi = async (section, history) => {
    const response = await fetch(`${API_URL}/mock-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, history }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get interview response.');
    }
    return response.json();
};
