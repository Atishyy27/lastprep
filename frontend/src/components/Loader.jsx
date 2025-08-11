// src/components/Loader.jsx
import React from 'react';

export const Loader = ({ text }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 rounded-full animate-spin border-4 border-dashed border-indigo-500 border-t-transparent"></div>
        <p className="mt-4 text-lg font-semibold text-gray-400">{text}</p>
    </div>
);

// src/components/MockInterviewModal.jsx
import { useState, useEffect, useRef } from 'react';
import { mockInterviewApi } from '../services/api';

const IconMic = () => <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z"/><path fillRule="evenodd" d="M10 18a8 8 0 008-8h-2a6 6 0 01-12 0H2a8 8 0 008 8z" clipRule="evenodd"/></svg>;

export const MockInterviewModal = ({ section, onClose }) => {
    const [history, setHistory] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(prev => prev + finalTranscript);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
        }
        setIsListening(!isListening);
    };

    const getNextStep = async (currentHistory) => {
        setIsThinking(true);
        try {
            const data = await mockInterviewApi(section, currentHistory);
            if (data.next_question) {
                setHistory(prev => {
                    if (!data.feedback) {
                        return [...prev, { question: data.next_question, answer: null, feedback: null }];
                    }
                    const updatedHistory = [...prev];
                    updatedHistory[updatedHistory.length - 1].feedback = data.feedback;
                    return [...updatedHistory, { question: data.next_question, answer: null, feedback: null }];
                });
            }
        } catch (err) { console.error(err); } finally { setIsThinking(false); }
    };

    useEffect(() => { getNextStep([]); }, []);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isThinking]);

    const submitAnswer = () => {
        if (isListening) toggleListen();
        if (!transcript.trim()) return;
        const updatedHistory = [...history];
        updatedHistory[updatedHistory.length - 1].answer = transcript;
        setHistory(updatedHistory);
        getNextStep(updatedHistory);
        setTranscript('');
    };
    
    const lastTurn = history[history.length - 1];

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
                <header className="p-4 border-b border-slate-700 flex justify-between items-center"><h2 className="text-xl font-bold text-white">Live Mock Interview: <span className="text-indigo-400">{section.title}</span></h2><button onClick={onClose} className="text-3xl text-slate-400 hover:text-white">&times;</button></header>
                <main className="flex-grow p-6 overflow-y-auto space-y-6">
                    {history.map((turn, index) => (
                        <div key={index}>
                            <div className="p-4 bg-slate-700 rounded-lg"><p className="font-semibold text-indigo-300">Interviewer:</p><p className="text-white mt-1">{turn.question}</p></div>
                            {turn.answer && <div className="mt-4 p-4 bg-slate-900 border border-slate-600 rounded-lg"><p className="font-semibold text-cyan-300">Your Answer:</p><p className="text-white mt-1 whitespace-pre-wrap">{turn.answer}</p></div>}
                            {turn.feedback && <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg"><p className="font-semibold text-green-300">Feedback:</p><p className="text-green-200 mt-1">{turn.feedback}</p></div>}
                        </div>
                    ))}
                    {isThinking && <Loader text="Interviewer is thinking..." />}
                    <div ref={chatEndRef} />
                </main>
                {lastTurn && !lastTurn.answer && !isThinking && (
                    <footer className="p-4 border-t border-slate-700 flex-shrink-0 space-y-4 bg-slate-800 rounded-b-2xl">
                        <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="w-full p-3 border bg-slate-700 border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows="4" placeholder="Type or speak your answer..."></textarea>
                        <div className="flex items-center justify-between">
                            <button onClick={toggleListen} className={`px-4 py-2 rounded-md font-semibold flex items-center transition-colors ${isListening ? 'bg-red-600 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}><IconMic/>{isListening ? 'Recording...' : 'Speak Answer'}</button>
                            <button onClick={submitAnswer} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 text-lg">Submit Answer</button>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};
