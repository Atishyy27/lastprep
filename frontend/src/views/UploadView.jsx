// src/views/UploadView.jsx
import React from 'react';

const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;

export const UploadView = ({ onFileChange, onParse, isParsing, cvFile, error }) => (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold" style={{fontFamily: "'Lora', serif"}}>PrepAI</h1>
            <p className="mt-4 text-xl text-slate-400">Your Personal AI Interview Coach</p>
        </div>
        <div className="w-full max-w-lg">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl space-y-6">
                <label htmlFor="file-upload" className="cursor-pointer group block">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 group-hover:border-indigo-500 transition-colors text-center">
                        <IconUpload/>
                        <p className="mt-4 text-slate-400">{cvFile ? `Selected: ${cvFile.name}` : "Upload your CV (PDF)"}</p>
                    </div>
                    <input id="file-upload" type="file" accept=".pdf" className="sr-only" onChange={onFileChange} />
                </label>
                <button onClick={onParse} disabled={isParsing} className="w-full py-4 text-xl font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isParsing ? 'Parsing...' : 'Build My Dashboard'}
                </button>
            </div>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    </div>
);
