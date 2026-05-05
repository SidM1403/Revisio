"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useNotesStore } from '@/store/notesStore';
import { buildPptx } from '@/lib/pptx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useUser } from '@clerk/nextjs';
import UpgradeModal from '@/components/UpgradeModal';

export default function NotesViewer() {
  const { rawText, summary, setSummary, clearNotes } = useNotesStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [level, setLevel] = useState<'short' | 'exam' | 'detailed'>('exam');
  const [persona, setPersona] = useState<'standard' | 'eli5' | 'interview'>('standard');
  const [language, setLanguage] = useState<string>('English');
  
  const [isExportingPPT, setIsExportingPPT] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  const { user } = useUser();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPremium = user?.publicMetadata?.isPremium === true;

  const generateSummary = async () => {
    if (!rawText) return;
    
    setIsGenerating(true);
    setSummary('');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, level, persona }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSummary((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      console.error('Failed to generate summary', error);
      setSummary('Failed to generate summary. Make sure OPENROUTER_API_KEY is set in .env.local.');
    } finally {
      setIsGenerating(false);
      setLanguage('English'); 
    }
  };

  const handleTranslate = async (targetLang: string) => {
    if (!summary || isGenerating || isTranslating) return;
    setLanguage(targetLang);
    if (targetLang === 'English') return; 

    setIsTranslating(true);
    const originalText = summary;
    setSummary('');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, targetLanguage: targetLang }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSummary((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      console.error('Failed to translate', error);
      setSummary('Failed to translate.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePremiumAction = (action: () => void) => {
    if (!user) {
       alert("Please sign in first.");
       return;
    }
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    action();
  };

  const exportPPT = async () => {
    if (!summary) return;
    setIsExportingPPT(true);
    try {
      const res = await fetch('/api/ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary, numSlides: 5 }), 
      });
      if (!res.ok) throw new Error('Failed to generate slides');
      const data = await res.json();
      await buildPptx(data.slides);
    } catch (error) {
      console.error('PPT Export failed', error);
      alert('Failed to export PPT.');
    } finally {
      setIsExportingPPT(false);
    }
  };

  const exportPDF = async () => {
    const content = document.getElementById('pdf-content');
    if (!content) return;
    
    setIsExportingPDF(true);
    try {
      // Temporarily show for capture but keep off-screen
      content.style.display = 'block';
      content.style.position = 'fixed';
      content.style.left = '-9999px';
      content.style.top = '0';
      
      const canvas = await html2canvas(content, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      content.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Handle multi-page if content is long
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('StudyAI-CheatSheet.pdf');
    } catch (error) {
      console.error('PDF Export failed', error);
      alert('Failed to export PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const saveToProfile = async () => {
    if (!user) {
      alert("Please sign in to save notes.");
      return;
    }
    if (!rawText && !summary) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Prevent Turso "Payload Too Large" errors by truncating the raw text
      // since the user already agreed to prioritize saving the generated Summary.
      const safeContent = rawText && rawText.length > 5000 
        ? rawText.substring(0, 5000) + '\n\n... [Original document truncated to save space]'
        : (rawText || "No original text");

      const res = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: safeContent, summary: summary || "" }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save session: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111118] border border-white/10 rounded-2xl p-4 shadow-xl">
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Detail Level</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
              {['short', 'exam', 'detailed'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLevel(opt as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    level === opt ? 'bg-[#7c6dfa] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">AI Persona</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
              {[
                { id: 'standard', label: 'Tutor' },
                { id: 'eli5', label: 'Explain like 10' },
                { id: 'interview', label: 'Interview' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPersona(opt.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    persona === opt.id ? 'bg-[#fa6d8c] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {summary && !isGenerating && (
             <div className="flex flex-col gap-1">
               <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Translate</span>
               <select 
                 value={language}
                 onChange={(e) => handleTranslate(e.target.value)}
                 disabled={isTranslating}
                 className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#6dfabc] transition-all disabled:opacity-50"
               >
                 <option value="English">English</option>
                 <option value="Spanish">Spanish</option>
                 <option value="French">French</option>
                 <option value="German">German</option>
                 <option value="Hindi">Hindi</option>
                 <option value="Japanese">Japanese</option>
                 <option value="Mandarin">Mandarin</option>
               </select>
             </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={generateSummary}
            disabled={isGenerating || isTranslating}
            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-[#7c6dfa] to-[#5b4be0] text-white rounded-lg shadow-[0_0_15px_rgba(124,109,250,0.4)] hover:shadow-[0_0_25px_rgba(124,109,250,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? 'Generating...' : 'Generate Notes'}
          </button>

          {summary && !isGenerating && !isTranslating && (
            <div className="flex items-center gap-2 border-l border-white/10 pl-2 relative">
              {!isPremium && <span className="absolute -top-3 right-0 bg-[#fa6d8c] text-[10px] px-2 py-0.5 rounded-full font-bold">PRO</span>}
              <button
                onClick={() => handlePremiumAction(exportPPT)}
                disabled={isExportingPPT}
                className="px-3 py-2 text-xs font-semibold bg-[#fad96d]/10 hover:bg-[#fad96d]/20 text-[#fad96d] rounded-lg transition-all border border-[#fad96d]/30 flex items-center gap-1"
                title="Export current summary to PowerPoint"
              >
                {!isPremium && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                {isExportingPPT ? 'Compiling PPT...' : 'PPTX'}
              </button>
              <button
                onClick={() => handlePremiumAction(exportPDF)}
                disabled={isExportingPDF}
                className="px-3 py-2 text-xs font-semibold bg-[#6dfabc]/10 hover:bg-[#6dfabc]/20 text-[#6dfabc] rounded-lg transition-all border border-[#6dfabc]/30 flex items-center gap-1"
                title="Download printable Cheat Sheet PDF"
              >
                {!isPremium && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                {isExportingPDF ? 'Generating...' : 'PDF'}
              </button>
            </div>
          )}
          
          <button 
            onClick={saveToProfile}
            disabled={isSaving}
            className={`ml-2 px-3 py-2 text-sm font-medium border rounded-lg transition-all flex items-center gap-1 ${saveSuccess ? 'bg-[#6dfabc]/20 text-[#6dfabc] border-[#6dfabc]/50' : 'text-[#6dfabc] hover:bg-[#6dfabc]/10 border-transparent hover:border-[#6dfabc]/20'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {saveSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />}
            </svg>
            {isSaving ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save')}
          </button>

          <button 
            onClick={clearNotes}
            className="px-3 py-2 text-sm font-medium text-[#fa6d8c] hover:bg-[#fa6d8c]/10 border border-transparent hover:border-[#fa6d8c]/20 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="w-full bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl min-h-[400px]">
        {summary ? (
          <div className="prose prose-invert prose-indigo max-w-none prose-headings:text-[#e8e8f0] prose-a:text-[#7c6dfa] prose-strong:text-[#fad96d] prose-ul:text-gray-300 prose-p:text-gray-300">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
            >
              {summary}
            </ReactMarkdown>
            {(isGenerating || isTranslating) && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#7c6dfa] animate-pulse"></span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16 opacity-60">
            <svg className="w-16 h-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400 font-mono text-sm">Select your preferences and click "Generate Notes" to create your smart summary.</p>
          </div>
        )}
      </div>

      <div id="pdf-content" style={{ 
        display: 'none', 
        background: '#ffffff', 
        color: '#000000', 
        padding: '50px', 
        width: '800px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid #7c6dfa', paddingBottom: '15px' }}>
          <h1 style={{ color: '#7c6dfa', fontSize: '32px', margin: 0 }}>StudyAI Cheat Sheet</h1>
          <span style={{ fontSize: '12px', color: '#666' }}>Generated by StudyAI</span>
        </div>
        <div className="pdf-markdown-content" style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {summary}
          </ReactMarkdown>
        </div>
        <div style={{ marginTop: '40px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '11px', color: '#999', textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} StudyAI - Smart Study Tools
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
