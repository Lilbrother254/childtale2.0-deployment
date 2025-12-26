
import React, { useEffect, useState } from 'react';
import { SparklesIcon, StarIcon } from './Icons';
import { ArtPencil, ArtCrayon } from './Branding';
import { generateColoringPage } from '../services/geminiService';
import { InteractiveTabletDemo } from './InteractiveTabletDemo';

interface HomePageProps {
   onStartCreating: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartCreating }) => {
   return (
      <div className="animate-fade-in">
         <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto relative z-10 min-h-[80vh] md:min-h-[90vh] flex flex-col justify-center">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none hidden lg:block overflow-visible z-0">
               <ArtPencil className="absolute -top-10 -left-20 w-48 h-48 opacity-90" rotation="12" />
               <ArtCrayon color="#ef4444" className="absolute top-40 -right-10 w-32 h-32 opacity-90" rotation="-45" />
               <ArtCrayon color="#3b82f6" className="absolute bottom-20 left-10 w-40 h-40 opacity-80" rotation="12" />
               <ArtCrayon color="#22c55e" className="absolute bottom-40 right-1/4 w-24 h-24 opacity-60" rotation="30" />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
               {/* Content Side: Emotional & Punchy */}
               <div className="space-y-6 md:space-y-10 animate-fade-in-up relative order-2 lg:order-1 text-center lg:text-left">
                  <div className="relative">
                     <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase border border-indigo-100 mb-6 shadow-sm">
                        ✨ #1 Personalized Coloring Book Creator
                     </div>

                     <h1 className="text-4xl md:text-6xl lg:text-8xl font-black font-['Nunito'] leading-[1.05] text-slate-900 tracking-tight">
                        <span className="text-red-500 inline-block animate-pulse">♥</span>
                        They're Only <br className="hidden md:block" /> Little Once.
                     </h1>
                     <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold font-['Nunito'] text-indigo-600 mt-4 tracking-tight leading-tight">
                        Capture the magic before it's gone.
                     </h2>
                  </div>

                  <div className="text-base md:text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                     <p>
                        Turn their dreams into a 25-page <span className="font-bold text-slate-900 bg-yellow-100 px-1">custom coloring book</span> where <span className="font-black text-indigo-600">THEY</span> are the hero.
                     </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                     <button
                        onClick={onStartCreating}
                        className="bg-[#FF721F] hover:bg-[#FF853A] text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                     >
                        <SparklesIcon className="w-5 h-5" />
                        Start Free Story
                     </button>
                  </div>
               </div>

               {/* Visual Side: The "Magic" Tablet (Hero on Mobile) */}
               <div className="relative animate-fade-in-up order-1 lg:order-2" style={{ animationDelay: '0.2s' }}>
                  <div className="relative w-full max-w-[480px] mx-auto aspect-[3/4] bg-[#0F172A] rounded-[2.5rem] p-3 shadow-[0_50px_100px_rgba(0,0,0,0.15)] border border-slate-800 transform lg:rotate-2 hover:rotate-0 transition-all duration-700 ring-8 ring-slate-900 ring-opacity-10">
                     <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rounded-full z-20 border border-slate-700 opacity-50"></div>

                     {/* The Heart of the App: Coloring Demo */}
                     <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white">
                        <InteractiveTabletDemo onCTA={onStartCreating} />
                     </div>

                     <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-full z-20 opacity-30"></div>
                  </div>

                  {/* Testimonial Badge (Floats on Desktop, Centered on Mobile) */}
                  <div className="hidden md:flex absolute -bottom-6 -left-12 bg-white border border-slate-100 p-4 rounded-2xl shadow-xl max-w-[240px] gap-3 animate-bounce-slow">
                     <span className="text-2xl mt-1">💛</span>
                     <p className="text-[11px] font-bold text-slate-600 italic leading-snug">
                        "The only book she refuses to donate." <br />
                        <span className="text-indigo-600 uppercase tracking-widest text-[9px] not-italic mt-1 block">— Happy Parent</span>
                     </p>
                  </div>
               </div>
            </div>
         </section>

         {/* Secondary Preview Section (The "Result") */}
         <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
               <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[3/4] flex flex-col transform lg:-rotate-1">
                  <div className="pt-8 px-8 text-center bg-white z-10">
                     <h2 className="text-3xl md:text-4xl font-['Comic_Neue'] font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] [-webkit-text-stroke:1.5px_black] tracking-wide mb-2">
                        Vinny's Big Adventure
                     </h2>
                  </div>
                  <div className="flex-grow px-4 pb-4 relative flex items-center justify-center bg-white">
                     <img
                        src="/hero-drawing.jpg"
                        alt="Final Product Preview"
                        className="w-full h-full object-contain"
                     />
                  </div>
                  <div className="px-8 pb-12 pt-2 text-center bg-white z-10">
                     <p className="font-['Comic_Neue'] text-lg font-bold leading-relaxed text-slate-700">
                        Inside, the classroom was colorful and new. Vinny was the hero of his own story!
                     </p>
                  </div>
               </div>

               <div className="space-y-8 text-center lg:text-left">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-['Nunito'] text-slate-900 leading-tight">
                     From Screen <br /> <span className="text-indigo-600">to Hardcover.</span>
                  </h2>
                  <p className="text-lg md:text-xl text-slate-600 max-w-xl font-medium mx-auto lg:mx-0">
                     Every generation creates a high-resolution coloring book file you can print at home, or have shipped as a premium hardcover keepsake.
                  </p>
                  <button onClick={onStartCreating} className="bg-slate-900 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl">
                     Explore the Library
                  </button>
               </div>
            </div>
         </section>


         <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden animate-fade-in-up">
            <div className="max-w-4xl mx-auto text-center relative z-10">
               <h2 className="text-4xl md:text-6xl font-black font-['Nunito'] mb-6 leading-tight">
                  Don't just take our word for it. <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">See the magic yourself.</span>
               </h2>
               <button
                  onClick={onStartCreating}
                  className="bg-white text-slate-900 text-lg md:text-xl font-bold py-4 md:py-5 px-8 md:px-12 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mx-auto w-fit"
               >
                  <SparklesIcon className="w-6 h-6 text-yellow-500" />
                  Create Free 5-Page Story
               </button>
            </div>
         </section>
      </div>
   );
};
