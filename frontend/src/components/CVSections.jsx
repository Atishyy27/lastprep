/**
 * frontend/src/components/CVSections.jsx
 * Shows parsed CV sections as clickable list.
 * On click, sends selected section object up.
 */

import React from "react";

export default function CVSections({ sections, onSelect }) {
  return (
    <div className="p-4 bg-white rounded shadow-md max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Your CV Sections</h2>
      <ul className="space-y-3">
        {Object.entries(sections).map(([key, items]) => {
          if (items.length === 0) return null;
          return (
            <li key={key}>
              <h3 className="text-indigo-700 text-lg font-semibold mb-1">
                {key.toUpperCase()} ({items.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto border p-2 rounded bg-gray-50">
                {items.map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => onSelect(item)}
                      className="text-left w-full hover:text-indigo-900 focus:outline-none"
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
