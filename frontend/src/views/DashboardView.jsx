// src/views/DashboardView.jsx
import React from 'react';
import { MockInterviewModal } from '../components/MockInterview.jsx';

const IconProject = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const IconExperience = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

export const DashboardView = ({ cvSections, onReset }) => {
    const [activeSection, setActiveSection] = React.useState(null);
    const [interviewingSection, setInterviewingSection] = React.useState(null);

    React.useEffect(() => {
        // FIX: This is a much safer way to set the initial active section.
        // It prevents crashing if 'projects' or 'experience' is missing or empty.
        if (cvSections) {
            if (cvSections.projects && cvSections.projects.length > 0) {
                setActiveSection(cvSections.projects[0]);
            } else if (cvSections.experience && cvSections.experience.length > 0) {
                setActiveSection(cvSections.experience[0]);
            } else {
                setActiveSection(null);
            }
        }
    }, [cvSections]);

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            <div className="flex h-screen">
                <aside className="w-1/3 xl:w-1/4 bg-slate-800/50 border-r border-slate-700 p-6 flex flex-col">
                    <h1 className="text-2xl font-bold mb-8" style={{fontFamily: "'Lora', serif"}}>PrepAI Dashboard</h1>
                    <nav className="space-y-6 overflow-y-auto">
                        {/* FIX: Safely map over the sections */}
                        {cvSections && Object.entries(cvSections).map(([sectionName, items]) => (
                            Array.isArray(items) && items.length > 0 && (
                                <div key={sectionName}>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                        {sectionName === 'projects' ? <IconProject/> : <IconExperience/>}
                                        <span className="ml-2">{sectionName}</span>
                                    </h3>
                                    <ul className="space-y-2">
                                        {items.map((item) => (
                                            <li key={item.title}>
                                                <button onClick={() => setActiveSection(item)} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${activeSection?.title === item.title ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700'}`}>{item.title}</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        ))}
                    </nav>
                    <div className="mt-auto pt-6 border-t border-slate-700">
                        <button onClick={onReset} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm">Upload New CV</button>
                    </div>
                </aside>

                <main className="w-2/3 xl:w-3/4 p-10 overflow-y-auto">
                    {activeSection ? (
                        <div className="bg-slate-800 p-8 rounded-2xl">
                            <h2 className="text-4xl font-bold text-indigo-300">{activeSection.title}</h2>
                            <p className="mt-4 text-slate-300 whitespace-pre-wrap">{activeSection.text}</p>
                            <div className="mt-8 border-t border-slate-700 pt-6">
                                <button onClick={() => setInterviewingSection(activeSection)} className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg text-lg shadow-lg hover:bg-green-500 transition-transform transform hover:scale-105">
                                    Start Live Mock Interview
                                </button>
                            </div>
                        </div>
                    ) : <p className="text-slate-400">Select a project or experience from the sidebar to get started.</p>}
                </main>
            </div>
            {interviewingSection && <MockInterviewModal section={interviewingSection} onClose={() => setInterviewingSection(null)} />}
        </div>
    );
};
