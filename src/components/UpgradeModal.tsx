"use client";

import { useState } from 'react';

export default function UpgradeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const loadRes = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!loadRes) {
        alert('Razorpay SDK failed to load');
        return;
      }

      const res = await fetch('/api/payment', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: data.amount,
        currency: data.currency,
        name: 'StudyAI Premium',
        description: 'Unlock PPT Exports, Cheat Sheets, and Strict Exam Mode',
        order_id: data.id,
        handler: async function (response: any) {
          alert('Payment Successful! (In production, a webhook would verify and update your premium status via Clerk metadata.)');
          onClose();
        },
        theme: { color: '#7c6dfa' },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error(error);
      alert('Payment initialization failed. Ensure RAZORPAY API keys are set.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-[#7c6dfa]/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(124,109,250,0.2)] text-center relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="w-16 h-16 bg-gradient-to-br from-[#7c6dfa] to-[#fa6d8c] rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7c6dfa] to-[#fa6d8c] mb-2">
          Unlock StudyAI Pro
        </h2>
        <p className="text-gray-400 mb-6">Master your materials with premium export tools and strict exam modes.</p>
        
        <ul className="text-left space-y-3 mb-8">
           <li className="flex items-center gap-2 text-gray-300">
             <svg className="w-5 h-5 text-[#6dfabc]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             Export directly to PowerPoint (.pptx)
           </li>
           <li className="flex items-center gap-2 text-gray-300">
             <svg className="w-5 h-5 text-[#6dfabc]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             Printable PDF Cheat Sheets
           </li>
           <li className="flex items-center gap-2 text-gray-300">
             <svg className="w-5 h-5 text-[#6dfabc]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             Strict Exam Mode with Weakness Analysis
           </li>
        </ul>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-[#7c6dfa] to-[#5b4be0] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,109,250,0.4)] hover:shadow-[0_0_30px_rgba(124,109,250,0.6)] transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Upgrade Now - ₹999'}
        </button>
      </div>
    </div>
  );
}
