
import React from 'react';
import { CheckIcon, StarIcon, PencilIcon, SparklesIcon, PaletteIcon } from './Icons';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto animate-fade-in font-['Nunito']">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">From Heart to Art in 3 Steps</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              You provide the heart—we handle the art. It's that simple.
            </p>
        </div>
        
        <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                <div className="w-32 h-32 bg-blue-100/50 rounded-full flex items-center justify-center shrink-0">
                   <PencilIcon className="w-16 h-16 text-blue-600" />
                </div>
                <div className="text-center md:text-left space-y-3 flex-grow">
                    <h3 className="text-2xl font-extrabold text-slate-900">1. Your Words, Your Details</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                        You know the story best. Tell us about the loose tooth, the imaginary friend's funny name, or exactly what the birthday cake looked like.
                    </p>
                    <p className="text-blue-600 leading-relaxed text-sm font-medium">
                        The more authentic details you give, the more special it becomes. We don't make it up—we just bring your words to life.
                    </p>
                </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                <div className="w-32 h-32 bg-purple-100/50 rounded-full flex items-center justify-center shrink-0">
                   <SparklesIcon className="w-16 h-16 text-purple-600" />
                </div>
                <div className="text-center md:text-left space-y-3 flex-grow">
                    <h3 className="text-2xl font-extrabold text-slate-900">2. We Turn It Into a Book</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                        It takes a few minutes for our system to format your story into professional pages and draw custom illustrations for every single scene. It's like having a personal illustrator on speed dial.
                    </p>
                </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                <div className="w-32 h-32 bg-green-100/50 rounded-full flex items-center justify-center shrink-0">
                   <PaletteIcon className="w-16 h-16 text-green-600" />
                </div>
                <div className="text-center md:text-left space-y-3 w-full">
                    <h3 className="text-2xl font-extrabold text-slate-900">3. The Hybrid Experience: Magical & Print</h3>
                    <p className="text-slate-600 leading-relaxed font-medium mb-4">
                        We are the only platform that offers <strong>both</strong>. Forgot the art supplies? Use our <strong>Magical Studio</strong> to color instantly on your tablet—perfect for restaurants, planes, or while waiting for your hardcover to arrive.
                    </p>
                     
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                            <CheckIcon className="w-4 h-4" /> <span className="font-black">Included FREE</span> with every story
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                            <CheckIcon className="w-4 h-4" /> <strong>Magical Studio:</strong> Color digitally anywhere (No mess!)
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                            <CheckIcon className="w-4 h-4" /> <strong>Print Ready:</strong> Download PDF for real crayons
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                            <StarIcon className="w-4 h-4" /> Optional: We can ship a premium Hardcover to your door
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
