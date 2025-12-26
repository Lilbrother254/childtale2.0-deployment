
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
      <div className="overflow-hidden">
         {/* 🌌 THE MAGICAL HERO */}
         <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-visible">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
               <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
               <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] bg-rose-200/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

               {/* 🎨 Floating Art Tools */}
               <ArtPencil className="absolute top-40 left-[10%] w-48 h-48 opacity-40 animate-magic-float hidden lg:block" rotation="15" />
               <ArtCrayon color="#ef4444" className="absolute bottom-60 right-[15%] w-32 h-32 opacity-30 animate-magic-float hidden lg:block" rotation="-15" />
            </div>

            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-0 items-center relative z-10">
               {/* Emotional Hook */}
               <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-2 border border-indigo-100 shadow-sm">
                     <SparklesIcon className="w-3.5 h-3.5" /> Handcrafted Memories
                  </div>

                  <h1 className="text-5xl md:text-7xl lg:text-[100px] font-black leading-[0.95] tracking-tight text-gradient-primary">
                     They're Only <br /> <span className="text-gradient-magic">Little Once.</span>
                  </h1>

                  <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                     Capture the magic of childhood in a 25-page custom coloring book where <span className="text-slate-900 font-black">THEY</span> are the hero of every story.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-6">
                     <button
                        onClick={onStartCreating}
                        className="bg-slate-900 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group"
                     >
                        <StarIcon className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                        Color Your Story Free
                     </button>
                     <div className="flex items-center gap-3 px-2">
                        <div className="flex -space-x-3">
                           {[1, 2, 3].map(i => (
                              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                 <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Parent" />
                              </div>
                           ))}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined by 2k+ Parents</p>
                     </div>
                  </div>
               </div>

               {/* Immersive Product Hero */}
               <div className="relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {/* The Glow Halo */}
                  <div className="absolute inset-0 bg-indigo-400/20 blur-[80px] rounded-full scale-75 animate-pulse" />

                  {/* The Glass Device Frame */}
                  <div className="relative w-full max-w-[500px] mx-auto aspect-[3/4] p-3 rounded-[3rem] glass-card border border-white/80 shadow-[0_40px_100px_rgba(0,0,0,0.1)] transition-transform duration-1000 animate-magic-float overflow-hidden">
                     {/* Inner Screen */}
                     <div className="w-full h-full rounded-[2.2rem] bg-white overflow-hidden shadow-inner flex flex-col">
                        <InteractiveTabletDemo onCTA={onStartCreating} />
                     </div>
                  </div>

                  {/* Floating Micro-Features */}
                  <div className="absolute -top-10 -right-10 lg:right-0 glass-pill p-4 rounded-2xl shadow-xl animate-magic-float max-w-[180px]" style={{ animationDelay: '1.5s' }}>
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                        ✨ 25 Pages <br />
                        🖍️ Digital Painting <br />
                        🏠 Home Delivery
                     </p>
                  </div>
               </div>
            </div>
         </section>

         {/* 🎨 THE MAGIC OF THE BOOK SECTION */}
         <section className="py-32 px-6 relative overflow-visible">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
               {/* 3D Result Preview */}
               <div className="relative group animate-fade-in-up">
                  <div className="absolute inset-0 bg-rose-400/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative rounded-[2.5rem] overflow-hidden glass-card p-4 shadow-2xl transition-all duration-700 group-hover:scale-[1.02]">
                     <div className="aspect-[3/4] bg-white rounded-[1.8rem] overflow-hidden flex flex-col shadow-inner">
                        <div className="pt-8 px-8 text-center bg-white z-10">
                           <h2 className="text-3xl font-['Comic_Neue'] font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] [-webkit-text-stroke:1.2px_black] tracking-wide mb-2 uppercase">
                              The Star of the Story
                           </h2>
                        </div>
                        <div className="flex-grow flex items-center justify-center p-8">
                           <img src="/hero-drawing.jpg" alt="Final Result" className="w-full h-full object-contain filter drop-shadow-xl" />
                        </div>
                     </div>
                  </div>

                  {/* Floating Testimonial Pill */}
                  <div className="absolute -bottom-10 right-0 glass-pill p-6 rounded-3xl shadow-2xl max-w-[280px] transform rotate-2 animate-magic-float">
                     <p className="text-slate-600 italic font-medium leading-relaxed text-sm">
                        "She literally won't put it down. It's the most meaningful gift we've ever bought."
                     </p>
                     <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">— Sarah J.</p>
                        <div className="flex text-yellow-400 text-xs">★★★★★</div>
                     </div>
                  </div>
               </div>

               {/* Copy Side */}
               <div className="space-y-10 text-center lg:text-left animate-fade-in-up">
                  <h2 className="text-5xl md:text-7xl font-black text-gradient-primary leading-tight">
                     From Dreams <br /> <span className="text-gradient-magic">to Hardcover.</span>
                  </h2>
                  <div className="space-y-6">
                     <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center flex-shrink-0 text-2xl">🪄</div>
                        <div>
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">AI-Powered Magic</h4>
                           <p className="text-slate-500 font-medium leading-relaxed">Our magic engine weaves your child's name and likeness into every illustration.</p>
                        </div>
                     </div>
                     <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center flex-shrink-0 text-2xl">🌎</div>
                        <div>
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Eco-Friendly Print</h4>
                           <p className="text-slate-500 font-medium leading-relaxed">We print only what is loved, on premium sustainable paper that lasts a lifetime.</p>
                        </div>
                     </div>
                  </div>
                  <button onClick={onStartCreating} className="bg-slate-900 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                     Explore the Studio
                  </button>
               </div>
            </div>
         </section>

         {/* 🚀 FINAL CTA SECTION */}
         <section className="py-24 px-6 mb-20 animate-fade-in-up">
            <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 p-12 lg:p-24 text-center relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.2)]">
               <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 blur-[120px] rounded-full" />
               <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-500/10 blur-[120px] rounded-full" />

               <div className="relative z-10 space-y-8">
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                     Create a core <br /> memory tonight.
                  </h2>
                  <p className="text-white/50 text-xl md:text-2xl font-medium max-w-2xl mx-auto">
                     Join thousands of parents making the magic of ChildTale real for their little ones.
                  </p>
                  <button
                     onClick={onStartCreating}
                     className="bg-white text-slate-900 px-12 py-6 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform active:scale-95 inline-flex items-center gap-3"
                  >
                     <SparklesIcon className="w-6 h-6 text-yellow-500" />
                     Start Free
                  </button>
               </div>
            </div>
         </section>
      </div>
   );
};

