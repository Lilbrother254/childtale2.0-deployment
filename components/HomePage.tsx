import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { InteractiveTabletDemo } from './InteractiveTabletDemo';

interface HomePageProps {
   onStartCreating: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartCreating }) => {
   return (
      <div className="min-h-screen">
         {/* HERO SECTION: Mobile-First */}
         <section className="pt-20 pb-16 px-4 md:pt-32 md:pb-24 md:px-6">
            <div className="max-w-6xl mx-auto">
               {/* Headline */}
               <div className="text-center mb-12 md:mb-16 space-y-4 md:space-y-6">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-slate-900">
                     They're Only <br className="md:hidden" />Little Once.
                  </h1>
                  <p className="text-lg md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto px-4">
                     Turn their dreams into a 25-page custom coloring book.
                  </p>
               </div>

               {/* Interactive Demo: The Star */}
               <div className="mb-12 md:mb-16">
                  <div className="max-w-md mx-auto md:max-w-lg lg:max-w-xl">
                     <div className="relative aspect-[3/4] rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 bg-white">
                        <InteractiveTabletDemo onCTA={onStartCreating} />
                     </div>
                  </div>
               </div>

               {/* Single CTA */}
               <div className="text-center">
                  <button
                     onClick={onStartCreating}
                     className="bg-slate-900 text-white px-8 py-4 md:px-12 md:py-5 rounded-full font-bold text-sm md:text-base uppercase tracking-wider shadow-xl hover:bg-black transition-all active:scale-95 inline-flex items-center gap-3"
                  >
                     <SparklesIcon className="w-5 h-5" />
                     Start Free
                  </button>
               </div>
            </div>
         </section>

         {/* RESULT PREVIEW SECTION */}
         <section className="py-16 px-4 md:py-24 md:px-6 bg-slate-50">
            <div className="max-w-6xl mx-auto">
               <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                  {/* Preview Image */}
                  <div className="order-2 md:order-1">
                     <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[3/4]">
                        <div className="pt-8 px-6 text-center">
                           <h2 className="text-2xl md:text-3xl font-['Comic_Neue'] font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] [-webkit-text-stroke:1.2px_black] tracking-wide">
                              The Final Book
                           </h2>
                        </div>
                        <div className="flex items-center justify-center p-6 md:p-8 h-[calc(100%-8rem)]">
                           <img
                              src="/hero-drawing.jpg"
                              alt="Final coloring book result"
                              className="w-full h-full object-contain"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Copy */}
                  <div className="order-1 md:order-2 text-center md:text-left space-y-6 md:space-y-8">
                     <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                        From Screen <br />to Hardcover.
                     </h2>
                     <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-lg mx-auto md:mx-0">
                        Every book is printed on premium paper and shipped to your door. Or download the PDF and print at home.
                     </p>
                     <button
                        onClick={onStartCreating}
                        className="bg-slate-900 text-white px-8 py-4 md:px-10 md:py-5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-black transition-all shadow-lg"
                     >
                        See How It Works
                     </button>
                  </div>
               </div>
            </div>
         </section>

         {/* FINAL CTA SECTION */}
         <section className="py-16 px-4 md:py-24 md:px-6 mb-12 md:mb-20">
            <div className="max-w-4xl mx-auto text-center bg-slate-900 rounded-3xl md:rounded-[3rem] p-10 md:p-16 lg:p-20 shadow-2xl">
               <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 md:mb-8">
                  Create a Memory <br className="hidden md:block" />Tonight.
               </h2>
               <p className="text-lg md:text-xl text-white/60 mb-8 md:mb-10 max-w-2xl mx-auto">
                  Join thousands of parents preserving childhood magic.
               </p>
               <button
                  onClick={onStartCreating}
                  className="bg-white text-slate-900 px-10 py-5 md:px-12 md:py-6 rounded-full font-black text-sm md:text-base uppercase tracking-wider shadow-2xl hover:scale-105 transition-transform active:scale-95 inline-flex items-center gap-3"
               >
                  <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                  Start Free
               </button>
            </div>
         </section>
      </div>
   );
};
