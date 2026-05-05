"use client";

import { useState, useEffect } from 'react';
import { useNotesStore } from '@/store/notesStore';

export default function SavedSessions({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { setNotes, setSummary } = useNotesStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async (retries = 3) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notes/history');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else if (res.status === 401 && retries > 0) {
        // Handle Clerk clock skew token errors by retrying
        console.warn(`Auth token not ready. Retrying in 5s... (${retries} retries left)`);
        setTimeout(() => fetchSessions(retries - 1), 5000);
        return; // Don't turn off loading state yet
      } else {
        console.error("Failed to fetch sessions, status:", res.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = (content: string, summary: string | null, name: string) => {
    if (!content && !summary) {
      alert("This session appears to be empty.");
      return;
    }
    setNotes(content || "", name || "Saved Session");
    if (summary) setSummary(summary);
    
    onClose();
    // Force a small delay to ensure the UI updates
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-full md:w-[350px] bg-[#111118] border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="font-semibold text-[#e8e8f0] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#6dfabc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Saved Sessions
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-10">
               <span className="w-6 h-6 border-2 border-[#6dfabc]/30 border-t-[#6dfabc] rounded-full animate-spin"></span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm mt-10">
              <p>No saved sessions yet.</p>
              <p className="mt-2 text-xs opacity-70">Save your notes in the Smart Notes tab to access them later.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.content, session.summary, "Saved Session")}
                className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#6dfabc]/50 transition-all group"
              >
                <div className="text-xs text-gray-400 font-mono mb-2 flex justify-between items-center">
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  <span className="text-[#6dfabc] opacity-0 group-hover:opacity-100 transition-opacity">Load →</span>
                </div>
                <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed">
                  {session.summary ? session.summary.substring(0, 100).replace(/[#*]/g, '') : session.content.substring(0, 100)}...
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
