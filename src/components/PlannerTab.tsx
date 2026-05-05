"use client";

import { useState } from 'react';
import { useNotesStore } from '@/store/notesStore';

type DayPlan = {
  dayNumber: number;
  title: string;
  tasks: string[];
  estimatedMinutes: number;
};

export default function PlannerTab() {
  const { rawText } = useNotesStore();
  const [schedule, setSchedule] = useState<DayPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState(7);

  const generatePlan = async () => {
    if (!rawText) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, durationDays: duration }),
      });
      if (!res.ok) throw new Error('Failed to generate plan');
      const data = await res.json();
      setSchedule(data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate schedule.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative min-h-[400px]">
      {schedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
          <div className="w-16 h-16 bg-[#7c6dfa]/10 text-[#7c6dfa] rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(124,109,250,0.2)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#e8e8f0]">AI Study Planner</h3>
          <p className="text-gray-400 max-w-sm mx-auto">Let AI break down your notes into a manageable daily schedule to prevent cramming.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <select 
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#7c6dfa] transition-all"
            >
              <option value={3}>3-Day Plan</option>
              <option value={7}>7-Day Plan</option>
              <option value={14}>14-Day Plan</option>
            </select>

            <button
              onClick={generatePlan}
              disabled={isGenerating || !rawText}
              className="px-6 py-3 text-sm font-semibold bg-[#7c6dfa] hover:bg-[#6b5ce0] text-white rounded-xl shadow-[0_0_15px_rgba(124,109,250,0.4)] disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isGenerating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Building...</> : 'Generate Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-2xl font-bold text-[#e8e8f0]">Your {duration}-Day Study Plan</h3>
            <button onClick={generatePlan} className="text-xs text-[#7c6dfa] hover:text-white px-3 py-1.5 border border-[#7c6dfa]/30 rounded-lg transition-colors">
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schedule.map((day) => (
              <div key={day.dayNumber} className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:border-white/20 transition-all shadow-inner group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-[#7c6dfa] bg-[#7c6dfa]/10 px-2 py-1 rounded">Day {day.dayNumber}</span>
                  <span className="text-xs text-gray-500 font-mono group-hover:text-gray-300 transition-colors">~{day.estimatedMinutes} mins</span>
                </div>
                <h4 className="font-semibold text-[#e8e8f0] mb-4 leading-snug">{day.title}</h4>
                <ul className="space-y-3">
                  {day.tasks.map((task, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6dfabc] mt-1.5 shrink-0 shadow-[0_0_8px_rgba(109,250,188,0.5)]"></span>
                      <span className="leading-relaxed">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
