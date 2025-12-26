
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

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
               <div className="space-y-6 md:space-y-8 animate-fade-in-up relative">
                  <div className="relative">
                     <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[12px] md:text-sm font-bold tracking-wide border border-indigo-100 mb-4 shadow-sm">
                        ✨ #1 Personalized Coloring Book Creator
                     </div>

                     <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-['Nunito'] leading-[1.1] text-slate-900 relative z-10 tracking-tight">
                        <span className="text-red-500 inline-block animate-bounce">♥</span>
                        They're Only <br />Little Once.
                     </h1>
                     <h2 className="text-2xl md:text-4xl font-extrabold font-['Nunito'] text-indigo-600 mt-2 relative inline-block tracking-tight">
                        Capture It Before It's Gone.
                     </h2>
                  </div>

                  <div className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg font-medium space-y-4">
                     <p>
                        Turn their dreams and memories into a <span className="font-bold text-slate-900 bg-yellow-100 px-1">25-page custom coloring book</span> where <span className="font-bold text-slate-900">THEY are the main character</span>.
                     </p>
                  </div>


               </div>

               <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="relative rounded-[1rem] overflow-hidden shadow-2xl border-[2px] border-slate-200 group transform rotate-1 hover:rotate-0 transition-transform duration-500 bg-white aspect-[3/4] flex flex-col">
                     <div className="pt-8 px-8 text-center bg-white z-10">
                        <h2 className="text-3xl md:text-4xl font-['Comic_Neue'] font-bold text-slate-800 mb-2">
                           Vinny's First Day
                        </h2>
                     </div>
                     <div className="flex-grow px-4 pb-4 relative flex items-center justify-center bg-white">
                        <img
                           src="/hero-drawing.jpg"
                           alt="Vinny's First Day"
                           className="w-full h-full object-contain animate-fade-in"
                        />
                     </div>
                     <div className="px-8 pb-12 pt-2 text-center bg-white z-10">
                        <p className="font-['Comic_Neue'] text-lg font-bold leading-relaxed text-slate-800">
                           Inside, the classroom was colorful and new. Vinny sat at his small desk and looked around shyly.
                        </p>
                     </div>
                  </div>
                  <div className="absolute -bottom-8 md:-bottom-12 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xs md:max-w-md bg-white p-2 md:p-3 rounded-full shadow-2xl border border-slate-100 flex items-center justify-center gap-2 z-30 transform hover:scale-105 transition-transform">
                     <button
                        onClick={onStartCreating}
                        className="flex-grow bg-orange-500 hover:bg-orange-600 text-white font-black text-sm md:text-lg py-3 md:py-4 px-6 md:px-8 rounded-full flex items-center justify-center gap-2 transition-all shadow-md"
                     >
                        <StarIcon className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                        Color Now
                     </button>
                  </div>
               </div>
            </div>
         </section>

         <section className="py-24 px-6 bg-[#2D3342] text-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
               <div className="order-2 lg:order-1 animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-yellow-300 uppercase tracking-widest mb-6 border border-white/10">
                     <SparklesIcon className="w-4 h-4" /> New Feature
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-['Nunito'] leading-tight mb-6">
                     Meaningful Screentime.
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-300 mb-8">
                     No crayons? No problem.
                  </h3>
                  <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl">
                     Forgot the art supplies? You can color right here in our <strong className="text-white">Magical Studio</strong>.
                  </p>
               </div>

               <div className="order-1 lg:order-2 flex justify-center perspective-[1000px] animate-fade-in-up">
                  <div className="relative w-full max-w-[500px] aspect-[3/4] bg-black rounded-[2rem] p-3 shadow-2xl border-[1px] border-slate-700 transform hover:scale-105 transition-transform duration-700 ring-4 ring-slate-800 ring-opacity-50">
                     <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rounded-full z-20 border border-slate-700"></div>

                     {/* Interactive Tablet Demo Component */}
                     <InteractiveTabletDemo onCTA={onStartCreating} />

                     <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-full z-20"></div>
                  </div>
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
