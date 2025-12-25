
import React from 'react';
import { HeartIcon, SparklesIcon, StarIcon, CheckIcon, PaletteIcon } from './Icons';
import { ArtCrayon } from './Branding';

export const AboutPage: React.FC = () => {
    return (
        <div className="pt-32 pb-24 px-6 font-['Nunito'] animate-fade-in">

            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest mb-6">
                    About ChildTale
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                    Bringing Imagination <br /> <span className="text-blue-600">Back to Life.</span>
                </h1>

                {/* Quote Section */}
                <div className="max-w-3xl mx-auto my-12 relative">
                    <div className="absolute -top-6 -left-6 text-6xl text-yellow-300 opacity-50 font-serif">"</div>
                    <blockquote className="text-2xl md:text-3xl font-bold text-slate-700 italic leading-relaxed">
                        Children see magic because they look for it.
                    </blockquote>
                    <div className="absolute -bottom-6 -right-6 text-6xl text-yellow-300 opacity-50 font-serif rotate-180">"</div>
                    <cite className="block mt-4 text-slate-400 font-bold not-italic tracking-wide uppercase text-sm">— Christopher Moore</cite>
                </div>

                <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mt-12">
                    We believe every child is the hero of their own story. We just provide the pages.
                </p>
            </div>

            {/* Mission Grid */}
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 mb-24">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <HeartIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Heart to Art</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        Personalization isn't just a name on a cover. It's about capturing the specific details—the lost tooth, the favorite toy, the best friend—that make childhood magic.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                        <SparklesIcon className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Instant Magic</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        Our advanced system generates professional-grade illustrations in seconds. No waiting weeks for an artist. The moment inspiration strikes, we are ready.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                        <StarIcon className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Quality First</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        From our digital tools to our hardcover printing, we are obsessed with quality. These aren't just throwaway sheets; they are keepsakes for a lifetime.
                    </p>
                </div>
            </div>

            {/* Phygital / Hybrid Section - UPDATED */}
            <div className="max-w-7xl mx-auto mb-24 relative">
                <div className="absolute top-0 right-0 hidden md:block opacity-20 transform translate-x-1/4 -translate-y-1/4">
                    <ArtCrayon color="#F59E0B" rotation="45" className="w-64 h-64" />
                </div>

                <div className="bg-slate-50 rounded-[3rem] p-8 md:p-12 lg:p-16 border border-slate-100 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Image Placeholder */}
                    <div className="w-full lg:w-1/2">
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-200">
                            {/* Placeholder for "Phygital" Image - Child with Tablet & Book */}
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/about-magic.png)' }}>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <p className="font-bold text-lg mb-1">Physical Book + Magical Studio</p>
                                    <div className="flex gap-2">
                                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/30">Tablet Ready</span>
                                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/30">Print Ready</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="w-full lg:w-1/2">
                        <div className="inline-block bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-4">
                            The Best of Both Worlds
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                            The Magic is Hybrid.
                        </h2>
                        <p className="text-lg text-slate-600 font-medium mb-8 leading-relaxed">
                            We don't make you choose between screens and paper. ChildTale gives you the flexibility to play both ways.
                        </p>

                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                                    <PaletteIcon className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xl">The Magical Studio (Digital)</h4>
                                    <p className="text-slate-500 leading-snug mt-1">
                                        Our mess-free, browser-based creative suite. Use <strong>Magic Fill</strong> technology to color instantly on phones or tablets. Perfect for planes, restaurants, or the backseat.
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                                    <CheckIcon className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xl">The Forever Keepsake (Physical)</h4>
                                    <p className="text-slate-500 leading-snug mt-1">
                                        When the screen turns off, the memory remains. We print your story into a stunning, library-quality hardcover book that lasts a lifetime.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* The Why Now Section */}
            <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-20 text-white relative overflow-hidden">
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Why Now?</h2>
                        <div className="space-y-6 text-lg text-slate-300 font-medium">
                            <p>
                                In a world dominated by passive screen time, we wanted to build a bridge back to creativity.
                            </p>
                            <p>
                                ChildTale uses technology not to replace imagination, but to fuel it. We give children a starting point that is uniquely theirs, inviting them to pick up a crayon (real or digital) and finish the story.
                            </p>
                        </div>
                    </div>
                    <div className="relative aspect-square">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2rem] opacity-20 transform rotate-6"></div>
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-[2rem] border border-white/20 flex items-center justify-center p-8 text-center">
                            <p className="font-['Comic_Neue'] text-3xl md:text-4xl font-bold leading-relaxed">
                                "It's not just a book.<br />It's <span className="text-yellow-400">their</span> book."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
