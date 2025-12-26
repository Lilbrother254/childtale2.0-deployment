import React, { useState } from 'react';

interface Sample {
    title: string;
    filename: string;
    theme: string;
}

export const SamplesGallery: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const samples: Sample[] = [
        { title: "CEO Johnte's Big Dream", filename: "ceo_johnte_s_big_dream_coloring_book.pdf", theme: "Adventure" },
        { title: "Iron Sponge: The Ultimate Pilot", filename: "iron_sponge__the_ultimate_pilot_coloring_book.pdf", theme: "Adventure" },

        { title: "Joy's Gelatinous Journey", filename: "joy_s_gelatinous_journey_coloring_book.pdf", theme: "Fantasy" },
        { title: "Leo and the Trip to Bikini Bottom", filename: "leo_and_the_trip_to_bikini_bottom_interior.pdf", theme: "Fantasy" },
        { title: "Leo's Big Day at the Farm", filename: "leo_s_big_day_at_the_farm_coloring_book.pdf", theme: "Animals" },
        { title: "Leo's Morning Whirr", filename: "leo_s_morning_whirr_coloring_book.pdf", theme: "Everyday" },
        { title: "Mikestone and the Dream Factory", filename: "mikestone_and_the_dream_factory_coloring_book.pdf", theme: "Fantasy" }
    ];

    const nextSample = () => {
        setCurrentIndex((prev) => (prev + 1) % samples.length);
    };

    const prevSample = () => {
        setCurrentIndex((prev) => (prev - 1 + samples.length) % samples.length);
    };

    const currentSample = samples[currentIndex];

    return (
        <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest mb-4">
                        See the Magic
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                        Every Page is a Masterpiece
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                        Real examples from real ChildTale books. Each one personalized, each one unique.
                    </p>
                </div>

                {/* PDF Viewer */}
                <div className="relative">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Sample Info */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-slate-900 text-lg md:text-xl">{currentSample.title}</h3>
                                <p className="text-sm text-slate-500 font-bold">{currentSample.theme} Theme</p>
                            </div>
                            <div className="text-sm text-slate-400 font-bold">
                                {currentIndex + 1} / {samples.length}
                            </div>
                        </div>

                        {/* PDF Display */}
                        <div className="aspect-[3/4] bg-slate-100">
                            <iframe
                                src={`/samples/${currentSample.filename}#page=1&view=FitH`}
                                className="w-full h-full"
                                title={currentSample.title}
                            />
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSample}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-white rounded-full p-3 md:p-4 shadow-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                        aria-label="Previous sample"
                    >
                        <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSample}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 bg-white rounded-full p-3 md:p-4 shadow-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                        aria-label="Next sample"
                    >
                        <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Thumbnail Navigation */}
                <div className="mt-8 flex gap-2 overflow-x-auto pb-4 justify-center">
                    {samples.map((sample, index) => (
                        <button
                            key={sample.filename}
                            onClick={() => setCurrentIndex(index)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${index === currentIndex
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {sample.theme}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};
