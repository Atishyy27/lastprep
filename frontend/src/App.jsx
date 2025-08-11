/**
 * frontend/src/App.jsx
 * Main React app entry point implementing CV upload, parse, section display,
 * and mode selection for Mock Interview / Quick Review.
 * Production-ready with hooks, modular components, error & loading states.
 */

import React, { useState } from "react";
import CVUpload from "./components/CVUpload";
import CVSections from "./components/CVSections";
import MockInterview from "./components/MockInterview";
import QuickReview from "./components/QuickReview";

export default function App() {
  // App-wide states
  const [cvSections, setCvSections] = useState(null); // parsed CV sections object
  const [selectedSection, setSelectedSection] = useState(null);
  const [mode, setMode] = useState(null); // "mock" or "quick"
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset entire app state
  const resetApp = () => {
    setCvSections(null);
    setSelectedSection(null);
    setMode(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-4xl mx-auto font-sans">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Smart CV Interview Prep</h1>
      </header>

      {!cvSections ? (
        <CVUpload
          onSectionsParsed={(sections) => setCvSections(sections)}
          setError={setError}
          isLoading={isLoading}
          setLoading={setIsLoading}
        />
      ) : (
        <>
          <button
            onClick={resetApp}
            className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Upload New CV
          </button>

          {error && <div className="mb-4 text-red-600">{error}</div>}

          {!selectedSection ? (
            <CVSections sections={cvSections} onSelect={setSelectedSection} />
          ) : !mode ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Section: <span className="text-indigo-700">{selectedSection.title}</span>
              </h2>
              <p className="whitespace-pre-wrap p-2 bg-white border rounded shadow-sm max-h-48 overflow-auto">
                {selectedSection.text}
              </p>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => setMode("mock")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Mock Interview
                </button>
                <button
                  onClick={() => setMode("quick")}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Quick Review
                </button>
                <button
                  onClick={() => setSelectedSection(null)}
                  className="px-4 py-2 bg-gray-400 rounded hover:bg-gray-500"
                >
                  Back to Sections
                </button>
              </div>
            </div>
          ) : mode === "mock" ? (
            <MockInterview section={selectedSection} onBack={() => setMode(null)} />
          ) : (
            <QuickReview section={selectedSection} onBack={() => setMode(null)} />
          )}
        </>
      )}
    </div>
  );
}
