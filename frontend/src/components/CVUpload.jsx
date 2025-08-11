// frontend/src/components/CVUpload.jsx
import React, { useState } from "react";

export default function CVUpload({ onSectionsParsed, setError, isLoading, setLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files[0];
    if (file && file.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file before uploading.");
      return;
    }

    setError("");
    setLoading(true); // Correct: Use setter to indicate loading

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8000/parse-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to parse CV.");
      }

      const data = await response.json();
      onSectionsParsed(data);
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false); // Correct: Use setter to stop loading
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-md mx-auto">
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isLoading}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        className={`w-full py-2 rounded text-white ${
          selectedFile && !isLoading
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {isLoading ? "Uploading..." : "Upload & Parse CV"}
      </button>
    </div>
  );
}
