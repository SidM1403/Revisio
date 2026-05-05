"use client";

import { useState, useEffect } from 'react';
import { useNotesStore } from '@/store/notesStore';
import { useUser } from '@clerk/nextjs';
import UpgradeModal from '@/components/UpgradeModal';

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export default function QuizCard() {
  const { rawText } = useNotesStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [isExamMode, setIsExamMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);

  const { user } = useUser();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPremium = user?.publicMetadata?.isPremium === true;

  useEffect(() => {
    if (isExamMode && timeLeft !== null && timeLeft > 0 && !isFinished) {
      const timerId = setInterval(() => setTimeLeft(t => (t !== null && t > 0 ? t - 1 : 0)), 1000);
      return () => clearInterval(timerId);
    } else if (isExamMode && timeLeft === 0 && !isFinished) {
      setIsFinished(true); // time's up
    }
  }, [isExamMode, timeLeft, isFinished]);

  const startQuiz = async (examMode: boolean) => {
    if (!rawText) return;

    if (examMode) {
      if (!user) {
        alert("Please sign in to take the Exam.");
        return;
      }
      if (!isPremium) {
        setShowUpgrade(true);
        return;
      }
    }

    setIsGenerating(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setIsFinished(false);
    setWrongAnswers([]);
    setIsExamMode(examMode);
    setTimeLeft(examMode ? 300 : null); // 5 mins for exam

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, difficulty: examMode ? 'hard' : 'medium', count: examMode ? 10 : 5 }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data = await res.json();
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        throw new Error('No questions generated.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return;
    
    setSelectedOption(index);
    
    if (!isExamMode) {
      if (index === questions[currentIndex].answer) {
        setScore(s => s + 1);
      } else {
        setWrongAnswers(prev => [...prev, currentIndex]);
      }
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    if (isExamMode && selectedOption !== null) {
      if (selectedOption === questions[currentIndex].answer) {
        setScore(s => s + 1);
      } else {
        setWrongAnswers(prev => [...prev, currentIndex]);
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!rawText) return null;

  return (
    <div className="w-full bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      
      {/* Quiz generator state */}
      {questions.length === 0 && !isFinished && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
          <div className="w-16 h-16 bg-[#fa6d8c]/10 text-[#fa6d8c] rounded-full flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(250,109,140,0.2)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#e8e8f0]">Test Your Knowledge</h3>
          <p className="text-gray-400 max-w-sm">Choose standard practice or a strict Exam Mode to challenge yourself.</p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-4 relative">
            <button
              onClick={() => startQuiz(false)}
              disabled={isGenerating}
              className="px-6 py-3 text-sm font-semibold bg-[#fa6d8c] hover:bg-[#ff7b9a] text-white rounded-xl shadow-[0_0_20px_rgba(250,109,140,0.3)] disabled:opacity-50 transition-all"
            >
              Practice Quiz (5 Qs)
            </button>
            <div className="relative">
              {!isPremium && <span className="absolute -top-3 -right-2 bg-[#fa6d8c] text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">PRO</span>}
              <button
                onClick={() => startQuiz(true)}
                disabled={isGenerating}
                className="px-6 py-3 text-sm font-semibold bg-transparent border border-[#fa6d8c] text-[#fa6d8c] hover:bg-[#fa6d8c]/10 rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {!isPremium && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                <span>Strict Exam Mode</span>
                <span className="bg-[#fa6d8c]/20 text-[#fa6d8c] text-xs px-2 py-0.5 rounded">10 Qs / 5m</span>
              </button>
            </div>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-3 text-[#fa6d8c] mt-4">
              <span className="w-4 h-4 border-2 border-[#fa6d8c]/30 border-t-[#fa6d8c] rounded-full animate-spin"></span>
              <p className="animate-pulse text-sm">Crafting intelligent questions...</p>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {/* Quiz taking state */}
      {questions.length > 0 && !isFinished && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <div className="flex items-center gap-4">
              <span>Q {currentIndex + 1} of {questions.length}</span>
              {isExamMode && timeLeft !== null && (
                <span className={`px-3 py-1 rounded-md bg-black/40 border font-bold ${timeLeft < 60 ? 'border-red-500 text-red-400 animate-pulse' : 'border-white/10 text-white'}`}>
                  ⏳ {formatTime(timeLeft)}
                </span>
              )}
            </div>
            {!isExamMode && <span className="text-[#fa6d8c]">Score: {score}</span>}
          </div>

          <h4 className="text-xl font-semibold text-[#e8e8f0] leading-snug">
            {questions[currentIndex].question}
          </h4>

          <div className="grid grid-cols-1 gap-3 mt-6">
            {questions[currentIndex].options.map((opt, i) => {
              let btnClass = "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300";
              
              if (showExplanation && !isExamMode) {
                if (i === questions[currentIndex].answer) {
                  btnClass = "border-[#6dfabc] bg-[#6dfabc]/10 text-[#6dfabc]";
                } else if (i === selectedOption) {
                  btnClass = "border-[#fa6d8c] bg-[#fa6d8c]/10 text-[#fa6d8c]";
                } else {
                  btnClass = "border-white/5 bg-transparent text-gray-500 opacity-50";
                }
              } else if (isExamMode && selectedOption === i) {
                 btnClass = "border-[#7c6dfa] bg-[#7c6dfa]/20 text-white shadow-[0_0_15px_rgba(124,109,250,0.3)]";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(i)}
                  disabled={showExplanation}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${btnClass}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs opacity-50 mt-0.5">{['A', 'B', 'C', 'D'][i]}</span>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {isExamMode && selectedOption !== null && (
             <div className="mt-6 flex justify-end animate-fade-in">
               <button onClick={handleNext} className="px-8 py-3 bg-[#7c6dfa] text-white font-semibold rounded-xl hover:bg-[#6b5ce0] transition-colors shadow-[0_0_15px_rgba(124,109,250,0.4)]">
                 {currentIndex < questions.length - 1 ? 'Next Question' : 'Submit Exam'}
               </button>
             </div>
          )}

          {showExplanation && !isExamMode && (
            <div className="mt-6 animate-fade-in space-y-4">
              <div className="p-4 rounded-xl bg-[#fad96d]/5 border border-[#fad96d]/20 text-sm text-gray-300 leading-relaxed shadow-inner">
                <span className="font-semibold text-[#fad96d] mr-2">Explanation:</span>
                {questions[currentIndex].explanation}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 font-semibold text-white bg-[#7c6dfa] hover:bg-[#6b5ce0] rounded-xl transition-all shadow-[0_0_15px_rgba(124,109,250,0.4)]"
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Finished state */}
      {isFinished && (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-fade-in">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 ${score >= (questions.length / 2) ? 'bg-[#6dfabc]/10 text-[#6dfabc] shadow-[0_0_30px_rgba(109,250,188,0.2)]' : 'bg-[#fa6d8c]/10 text-[#fa6d8c] shadow-[0_0_30px_rgba(250,109,140,0.2)]'}`}>
            <span className="text-4xl font-bold">{score}/{questions.length}</span>
          </div>
          <h3 className="text-3xl font-bold text-[#e8e8f0]">
            {isExamMode ? "Exam Complete!" : "Practice Complete!"}
          </h3>
          
          {isExamMode && wrongAnswers.length > 0 && (
            <div className="w-full text-left bg-black/30 border border-white/5 rounded-xl p-6 mt-4">
              <h4 className="text-lg font-semibold text-[#fa6d8c] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Weak Topics to Review
              </h4>
              <ul className="space-y-4">
                {wrongAnswers.map(idx => (
                  <li key={idx} className="text-sm">
                    <p className="font-medium text-gray-200 mb-1">Q: {questions[idx].question}</p>
                    <p className="text-gray-400 border-l-2 border-[#fa6d8c]/50 pl-3 py-1 bg-white/5 rounded-r-md">{questions[idx].explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isExamMode && wrongAnswers.length === 0 && (
            <p className="text-[#6dfabc] text-lg font-medium">Flawless victory! You have mastered this material.</p>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => startQuiz(false)}
              className="px-6 py-3 font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              Practice Again
            </button>
            <button
              onClick={() => startQuiz(true)}
              className="px-6 py-3 font-semibold bg-[#fa6d8c]/10 hover:bg-[#fa6d8c]/20 text-[#fa6d8c] border border-[#fa6d8c]/30 rounded-xl transition-all"
            >
              Take New Exam
            </button>
          </div>
        </div>
      )}
      
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
