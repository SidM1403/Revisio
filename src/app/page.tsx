"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import { useNotesStore } from "@/store/notesStore";
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

const FileUploader = dynamic(() => import("@/components/FileUploader"), { ssr: false });
const NotesViewer = dynamic(() => import("@/components/NotesViewer"), { ssr: false });
const QuizCard = dynamic(() => import("@/components/QuizCard"), { ssr: false });
const ChatWithNotes = dynamic(() => import("@/components/ChatWithNotes"), { ssr: false });
const RevisionTab = dynamic(() => import("@/components/RevisionTab"), { ssr: false });
const PlannerTab = dynamic(() => import("@/components/PlannerTab"), { ssr: false });
const MindMapTab = dynamic(() => import("@/components/MindMapTab"), { ssr: false });
const SavedSessions = dynamic(() => import("@/components/SavedSessions"), { ssr: false });

export default function Home() {
  const { rawText } = useNotesStore();
  const [activeTab, setActiveTab] = useState<'notes' | 'quiz' | 'revision' | 'planner' | 'mindmap'>('notes');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const { user, isSignedIn } = useUser();
  const isPremium = user?.publicMetadata?.isPremium === true;

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center p-8 pt-24 overflow-x-hidden">
      
      {/* Left Top Action Bar */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50 flex items-center gap-3">
        {isSignedIn && (
          <button 
            onClick={() => setIsSessionsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold text-sm border border-white/10 backdrop-blur-md shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="hidden sm:inline">Saved Files</span>
          </button>
        )}
        <Link 
          href="/pricing"
          className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 text-gray-200 hover:text-white rounded-xl transition-all font-medium text-sm border border-white/20 backdrop-blur-xl shadow-lg"
        >
          <svg className="w-4 h-4 text-[#6dfabc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Plans
        </Link>
      </div>

      {/* Auth Header */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-4 z-50">
        {isPremium && (
          <span className="px-3 py-1 bg-gradient-to-r from-[#7c6dfa] to-[#fa6d8c] text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(124,109,250,0.5)]">
            PRO
          </span>
        )}
        {!isSignedIn ? (
          <div className="px-5 py-2 bg-black/20 hover:bg-black/40 text-white rounded-xl transition-colors font-semibold text-sm border border-white/20 backdrop-blur-xl shadow-lg">
            <SignInButton mode="modal" />
          </div>
        ) : (
          <div className="bg-black/20 p-1.5 rounded-full border border-white/20 backdrop-blur-xl shadow-lg">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        )}
      </div>

      <div className="max-w-5xl w-full flex flex-col items-center gap-8 mt-2">
        
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-6 mb-8 animate-fade-in flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-medium tracking-wide backdrop-blur-md cursor-default uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e5b2ca] animate-pulse"></span>
            Your intelligent study companion
          </div>
          
          <h1 
            className="text-6xl md:text-7xl lg:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fbc2eb] via-[#a6c1ee] to-[#7042f4] drop-shadow-[0_0_20px_rgba(166,193,238,0.3)] font-bold italic py-4 px-2"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Revisio
          </h1>
          
          <p className="text-white/70 text-base md:text-lg max-w-lg mx-auto font-light leading-relaxed">
            Instantly turn your documents into interactive flashcards, quizzes, and study plans.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['PDF', 'DOCX', 'PPTX', 'TXT'].map((format) => (
              <span key={format} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-white/40 text-[11px] font-medium tracking-widest backdrop-blur-sm cursor-default">
                {format}
              </span>
            ))}
          </div>
        </div>

        {!rawText ? (
          <FileUploader />
        ) : (
          <div className="w-full space-y-6 animate-fade-in">
            {/* Scrollable Tabs Container */}
            <div className="w-full overflow-x-auto pb-4 -mb-4 custom-scrollbar">
              <div className="flex items-center justify-center gap-2 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-2 w-max mx-auto shadow-2xl">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'notes' ? 'bg-[#7c6dfa] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Smart Notes
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'quiz' ? 'bg-[#fa6d8c] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Quiz Mode
                </button>
                <button
                  onClick={() => setActiveTab('revision')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'revision' ? 'bg-[#6dfabc] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Revision (SRS)
                </button>
                <button
                  onClick={() => setActiveTab('planner')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'planner' ? 'bg-[#5b4be0] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Study Planner
                </button>
                <button
                  onClick={() => setActiveTab('mindmap')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === 'mindmap' ? 'bg-[#fad96d] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Mind Map
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="w-full mt-6">
              {activeTab === 'notes' && <NotesViewer />}
              {activeTab === 'quiz' && <QuizCard />}
              {activeTab === 'revision' && <RevisionTab />}
              {activeTab === 'planner' && <PlannerTab />}
              {activeTab === 'mindmap' && <MindMapTab />}
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      {rawText && (
        <button
          onClick={() => setIsChatOpen(true)}
          className={`fixed bottom-8 right-8 z-40 p-4 bg-gradient-to-r from-[#7c6dfa] to-[#5b4be0] text-white rounded-full shadow-[0_0_25px_rgba(124,109,250,0.5)] hover:shadow-[0_0_35px_rgba(124,109,250,0.7)] transition-all transform hover:-translate-y-1 ${isChatOpen ? 'hidden' : 'flex'}`}
          title="Chat with your notes"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Drawers and Overlays */}
      {rawText && isChatOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsChatOpen(false)} />
          <ChatWithNotes isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
      )}

      {isSessionsOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSessionsOpen(false)} />
          <SavedSessions isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} />
        </>
      )}

    </main>
  );
}
