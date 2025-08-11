/**
 * frontend/src/components/MockInterview.jsx
 * Interactive mock interview UI:
 * - Show interviewer questions,
 * - Accept user's typed answer,
 * - Submit to backend /mock-interview,
 * - Show feedback + next question.
 */

import React, { useState, useEffect, useRef } from "react";

export default function MockInterview({ section, onBack }) {
  const [history, setHistory] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lastTurn = history.length ? history[history.length - 1] : null;

  useEffect(() => {
    if (history.length === 0) {
      // Trigger first question fetch
      fetchNextQuestion([]);
    }
  }, []);

  const fetchNextQuestion = async (currentHistory) => {
    isLoading(true);
    setError("");
    try {
      const res = await fetch("/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, history: currentHistory }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to get mock interview question");
      }
      const data = await res.json();
      if (data.next_question) {
        setHistory([...currentHistory, { question: data.next_question, answer: null }]);
        setAnswer("");
      } else if (data.feedback && data.next_question) {
        // This is follow-up response with feedback
        const newHistory = [...currentHistory];
        newHistory[newHistory.length - 1].feedback = data.feedback;
        newHistory.push({ question: data.next_question, answer: null, feedback: null });
        setHistory(newHistory);
        setAnswer("");
      } else {
        throw new Error("Unexpected AI response format.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      isLoading(false);
    }
  };

  const submitAnswer = () => {
    if (!answer.trim()) return;
    const updatedHistory = [...history];
    updatedHistory[updatedHistory.length - 1].answer = answer.trim();
    fetchNextQuestion(updatedHistory);
  };

  return (
    <div className="p-4 bg-white rounded shadow-md max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back to Section
      </button>

      <h2 className="text-xl font-semibold mb-4">Mock Interview: {section.title}</h2>

      {history.map((turn, i) => (
        <div key={i} className="mb-4">
          <p className="font-semibold text-indigo-700">Q: {turn.question}</p>
          {turn.answer && <p className="ml-4 text-gray-800">A: {turn.answer}</p>}
          {turn.feedback && (
            <p className="ml-4 mt-1 text-green-700 italic">Feedback: {turn.feedback}</p>
          )}
        </div>
      ))}

      <textarea
        disabled={loading}
        rows={4}
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full p-2 border rounded resize-none"
      ></textarea>

      <button
        onClick={submitAnswer}
        disabled={loading || !answer.trim()}
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Submit Answer"}
      </button>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
