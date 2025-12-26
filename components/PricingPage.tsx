
import React from 'react';
import { CheckIcon } from './Icons';
import { PRICING } from '../services/paymentService';

interface PricingPageProps {
  onPlanSelect?: (planId: string) => void;
  onBuyNow?: (type: 'digital' | 'hardcover') => void;
  onAddToCart?: (type: 'digital' | 'hardcover') => void;
  onStartCreating?: () => void;
  isAuthenticated?: boolean;
  mode?: 'display' | 'functional';
  bookId?: string;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBuyNow,
  onStartCreating,
  mode = 'display',
}) => {
  const isFunctional = mode === 'functional';

  const handleAction = (type: 'sample' | 'digital' | 'hardcover') => {
    if (!isFunctional || type === 'sample') {
      onStartCreating?.();
    } else {
      onBuyNow?.(type === 'hardcover' ? 'hardcover' : 'digital');
    }
  };

  return (
    <div className="py-12 md:py-20 px-4 md:px-6 max-w-7xl mx-auto font-['Nunito']">

      {/* Premium Strategy Banners */}
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex flex-wrap shadow-2xl items-center justify-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-[2rem] border border-slate-800 mb-8 animate-fade-in group/hero">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse" />
            Founders Circle
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText('HERO25');
              alert('HERO25 copied to clipboard!');
            }}
            className="flex items-center gap-2 text-sm font-black tracking-tight cursor-copy hover:text-yellow-400 transition-all px-3 py-1 rounded-lg hover:bg-white/5 active:scale-95 border border-transparent hover:border-white/10"
          >
            <span>First 100 Heroes: Use <span className="text-yellow-400 border-b-2 border-yellow-400/30">HERO25</span> for 25% Off</span>
            <svg className="w-4 h-4 opacity-40 group-hover/hero:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          </button>
        </div>

        <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          We're Not a <span className="text-indigo-600">Template Service</span>.
        </h2>
        <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto">
          ChildTale uses patent-pending magic to weave your child into the story, maintaining character consistency and heirloom quality in every page.
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText('WELCOME20');
            alert('WELCOME20 copied to clipboard!');
          }}
          className="mt-6 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest border-2 border-dashed border-indigo-200 cursor-copy hover:bg-indigo-100 hover:border-indigo-300 transition-all active:scale-95 group/welcome"
        >
          <span>First Purchase? Use <span className="text-indigo-900 underline decoration-indigo-200 underline-offset-4">WELCOME20</span> for 20% Off</span>
          <svg className="w-4 h-4 opacity-40 group-hover/welcome:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">

        {/* STEP 1: FREE SAMPLE */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col relative group">
          <div className="mb-8">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Step 1</span>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Free Sample</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900">$0</span>
            </div>
            <p className="text-slate-500 text-sm font-bold mt-4 leading-relaxed">
              Test the magic with a 5-page personalized story.
            </p>
          </div>

          <div className="w-full h-px bg-slate-100 mb-8"></div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "5 sample pages",
              "Download PDF instantly",
              "Access to Magic Studio",
              "No watermarks",
              "See the quality",
              "Yours to keep forever"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <CheckIcon className="w-5 h-5 text-green-500" /> {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleAction('sample')}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:scale-95 flex items-center justify-center"
          >
            Create Your Book
          </button>
        </div>

        {/* STEP 2: DIGITAL PDF (POPULAR) */}
        <div className="bg-[#5851FF] p-8 rounded-[2rem] shadow-2xl flex flex-col relative text-white transform lg:scale-105 z-10">
          <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
            Popular
          </div>

          <div className="mb-8">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2 block">Step 2</span>
            <h3 className="text-3xl font-black text-white mb-2">Digital PDF</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">${PRICING.DIGITAL_SINGLE}</span>
              <span className="text-white/60 font-bold text-xs ml-1">/ book</span>
            </div>
            <p className="text-white/80 text-sm font-bold mt-4 leading-relaxed">
              Instant gratification! Full 25-page story, yours forever.
            </p>
          </div>

          <div className="w-full h-px bg-white/10 mb-8"></div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "Download PDF instantly",
              "Full 25-page story",
              "Access to Magic Studio",
              "Print at home or shop",
              "High-res printable",
              "No watermarks"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-white">
                <CheckIcon className="w-5 h-5 text-yellow-400" /> {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleAction('digital')}
            className="w-full py-4 bg-white text-[#5851FF] rounded-2xl font-black text-sm tracking-wide transition-all hover:bg-indigo-50 shadow-xl active:scale-95 flex items-center justify-center"
          >
            Create Your Book
          </button>
        </div>

        {/* STEP 3: HARDCOVER */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-[2rem] border-2 border-orange-200 flex flex-col relative shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
            Premium
          </div>

          <div className="mb-8">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block">Step 3</span>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Hardcover</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-orange-600">${PRICING.HARDCOVER}</span>
            </div>
            <p className="text-slate-600 text-sm font-bold mt-4 leading-relaxed">
              Premium physical keepsake delivered to your door.
            </p>
          </div>

          <div className="w-full h-px bg-orange-200 mb-8"></div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "Download PDF as you wait",
              "Access to Magic Studio",
              "8.5x11\" premium hardcover",
              "Ships to your door",
              "Heirloom quality print",
              "Family library keepsake"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <CheckIcon className="w-5 h-5 text-orange-500" /> {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleAction('hardcover')}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm tracking-wide hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center"
          >
            Order Hardcover
          </button>
        </div >

      </div >

      <div className="mt-16 text-center text-slate-400 font-bold text-sm">
        <p>Questions? Every story is backed by our "Magic Guarantee". If it's not perfect, we'll fix it.</p>
      </div>
    </div >
  );
};
