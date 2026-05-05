"use client";

import { useState, useEffect } from 'react';
import { useNotesStore } from '@/store/notesStore';
import { Flashcard, addCards, getDueCards, updateCard, calculateSM2 } from '@/lib/srs';

export default function RevisionTab() {
  const { rawText } = useNotesStore();
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCards = async () => {
    setIsLoading(true);
    const cards = await getDueCards();
    setDueCards(cards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCards();
  }, []);

  const generateFlashcards = async () => {
    if (!rawText) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, count: 10 }),
      });
      if (!res.ok) throw new Error('Failed to generate cards');
      
      const newCards = await res.json();
      await addCards(newCards);
      await loadCards();
    } catch (error) {
      console.error(error);
      alert('Failed to generate flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = async (quality: number) => {
    const card = dueCards[currentCardIndex];
    const updatedCard = calculateSM2(quality, card);
    
    await updateCard(updatedCard);
    
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(c => c + 1);
      setIsFlipped(false);
    } else {
      setDueCards([]);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
     return <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-4">
        <span className="w-8 h-8 border-4 border-[#6dfabc]/30 border-t-[#6dfabc] rounded-full animate-spin"></span>
        Loading your deck...
     </div>;
  }

  return (
    <div className="w-full bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
      
      {dueCards.length === 0 ? (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-[#6dfabc]/10 text-[#6dfabc] rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(109,250,188,0.2)]">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#e8e8f0]">You're all caught up!</h3>
          <p className="text-gray-400 max-w-sm mx-auto">No flashcards due for review right now. Come back later or generate a new deck from your current notes.</p>
          
          <button
            onClick={generateFlashcards}
            disabled={isGenerating || !rawText}
            className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-[#6dfabc] to-[#45c993] text-black rounded-xl shadow-[0_0_15px_rgba(109,250,188,0.4)] hover:shadow-[0_0_25px_rgba(109,250,188,0.6)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> Extracting Cards...</>
            ) : (
              'Generate Deck (10 Cards)'
            )}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-lg mx-auto flex flex-col items-center animate-fade-in">
          <div className="w-full flex justify-between text-sm text-gray-400 font-mono mb-4">
             <span>Spaced Repetition Review</span>
             <span className="text-[#6dfabc] font-bold">{currentCardIndex + 1} / {dueCards.length}</span>
          </div>

          {/* Flashcard Component */}
          <div 
            className="relative w-full h-72 [perspective:1000px] cursor-pointer group"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <div className={`w-full h-full absolute transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              
              {/* Front side */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white/5 border border-white/10 rounded-2xl p-8 flex items-center justify-center text-center shadow-lg group-hover:border-[#6dfabc]/50 transition-colors">
                <h3 className="text-xl md:text-2xl font-semibold text-[#e8e8f0] leading-snug">
                  {dueCards[currentCardIndex].front}
                </h3>
                {!isFlipped && (
                  <span className="absolute bottom-6 text-xs text-gray-500 font-mono tracking-widest uppercase flex items-center gap-2">
                    Tap to flip
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                  </span>
                )}
              </div>

              {/* Back side */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-black/50 border border-[#6dfabc]/30 rounded-2xl p-8 flex items-center justify-center text-center shadow-lg [transform:rotateY(180deg)]">
                <p className="text-xl md:text-2xl text-[#6dfabc] font-medium leading-snug">
                  {dueCards[currentCardIndex].back}
                </p>
              </div>

            </div>
          </div>

          {/* SM-2 Evaluation Buttons */}
          <div className={`mt-8 w-full transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             <p className="text-center text-sm text-gray-400 mb-3">How well did you remember this?</p>
             <div className="grid grid-cols-4 gap-2">
               <button onClick={(e) => { e.stopPropagation(); handleReview(1); }} className="py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                 Again (1)
               </button>
               <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="py-3 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                 Hard (3)
               </button>
               <button onClick={(e) => { e.stopPropagation(); handleReview(4); }} className="py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                 Good (4)
               </button>
               <button onClick={(e) => { e.stopPropagation(); handleReview(5); }} className="py-3 bg-[#6dfabc]/10 text-[#6dfabc] hover:bg-[#6dfabc]/20 border border-[#6dfabc]/30 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                 Easy (5)
               </button>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
