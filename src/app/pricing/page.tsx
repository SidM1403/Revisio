"use client";

import React from 'react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '₹0',
    description: 'Perfect for getting started and exploring the magic.',
    features: [
      'Basic AI Summarization',
      'Flashcard Generation (Up to 10)',
      'Basic Quiz Mode',
      'Save up to 5 Sessions',
      'Standard AI Model'
    ],
    cta: 'Get Started',
    premium: false,
    color: 'gray'
  },
  {
    name: 'Pro',
    price: '₹150',
    description: 'For serious students who want to excel in their studies.',
    features: [
      'Advanced AI Summarization',
      'Unlimited Flashcards',
      'Comprehensive Quizzes',
      'Priority Support',
      'Unlimited Session History',
      'Premium Nemotron Model'
    ],
    cta: 'Upgrade to Pro',
    premium: true,
    highlight: true,
    color: 'indigo'
  },
  {
    name: 'Elite',
    price: '₹500',
    description: 'The ultimate toolkit for academic dominance.',
    features: [
      'Everything in Pro',
      'AI Study Planner',
      'Mind Map Generation',
      'PPT Slide Generation',
      'Exclusive Beta Features',
      'Direct API Access (Beta)'
    ],
    cta: 'Go Elite',
    premium: true,
    color: 'emerald'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-transparent text-[#e8e8f0] selection:bg-[#7c6dfa]/30">
      {/* Background Orbs removed to let global Grainient shine through */}

      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white transition-colors mb-8 group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 
            className="text-5xl md:text-7xl font-medium italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fbc2eb] via-[#a6c1ee] to-[#7042f4] drop-shadow-sm"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Elevate Your Learning
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
            Simple, transparent pricing to unlock the full potential of AI-powered studying.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative group flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 hover:scale-[1.02] backdrop-blur-2xl ${
                tier.highlight 
                  ? 'bg-black/40 border-white/20 shadow-[0_0_50px_rgba(124,109,250,0.2)] z-10' 
                  : 'bg-black/20 border-white/10 hover:border-white/30 shadow-xl'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#fbc2eb] to-[#a6c1ee] rounded-full text-[10px] font-bold uppercase tracking-widest text-black shadow-lg">
                  Recommended
                </div>              )}

              <div className="mb-8">
                <h3 
                  className="text-3xl font-medium italic mb-2"
                  style={{ fontFamily: 'var(--font-playfair), serif' }}
                >{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
                  {tier.price !== '₹0' && <span className="text-white/40 text-sm">/one-time</span>}
                </div>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 group/feat">
                    <div className={`mt-1 p-0.5 rounded-full transition-colors ${tier.highlight ? 'bg-[#a6c1ee]/20 text-[#a6c1ee]' : 'bg-white/5 text-white/30 group-hover/feat:text-white/60'}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-white/70 font-light">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 relative overflow-hidden group/btn ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-[#fbc2eb] via-[#a6c1ee] to-[#7042f4] text-black shadow-lg hover:shadow-2xl hover:scale-[1.02]'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <span className="relative z-10">{tier.cta}</span>
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-3xl mx-auto">
          <h2 
            className="text-4xl font-medium italic text-center mb-12 drop-shadow-lg"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >Questions & Answers</h2>
          <div className="grid gap-4">
            <div className="p-8 rounded-[2rem] bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl hover:border-white/20 transition-colors">
              <h4 className="font-semibold mb-2 text-white/90">Is the payment one-time or recurring?</h4>
              <p className="text-sm text-white/50 leading-relaxed font-light">All our plans are one-time payments for a full year of access. No monthly subscriptions, no surprises.</p>
            </div>
            <div className="p-8 rounded-[2rem] bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl hover:border-white/20 transition-colors">
              <h4 className="font-semibold mb-2 text-white/90">What happens after I upgrade?</h4>
              <p className="text-sm text-white/50 leading-relaxed font-light">Your account features are unlocked immediately. You can start using premium tools like the AI Study Planner and Mind Maps right away.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
