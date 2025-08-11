/**
 * frontend/src/components/QuickReview.jsx
 * UI to show quick bullet points summary for a CV section.
 * Calls backend /quick-review and displays points list.
 */

import React, { useState, useEffect } from "react";

export default function QuickReview({ section, onBack }) {
  const [points, setPoints] = useState([]);
  const [loading, isLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPoints() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/quick-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(section),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to get quick review points");
        }
        const data = await res.json();
        setPoints(data.points || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPoints();
  }, [section]);

  return (
    <div className="p-4 bg-white rounded shadow-md max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back to Section
      </button>

      <h2 className="text-xl font-semibold mb-4">Quick Review: {section.title}</h2>

      {loading ? (
        <p>Loading points...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : points.length === 0 ? (
        <p>No quick points available.</p>
      ) : (
        <ul className="list-disc list-inside space-y-2">
          {points.map((pt, i) => (
            <li key={i} className="whitespace-pre-wrap">{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
