
import React, { useState } from 'react';
import { UserInput, StoryCategory } from '../types';
import { SparklesIcon, RocketIcon, StarIcon, HeartIcon, PaletteIcon, ArrowLeftIcon, CheckIcon, ShoppingCartIcon } from './Icons';

interface StoryInputFormProps {
    onSubmit: (input: UserInput) => void;
    onAddToCart: (input: UserInput) => void;
    onBack: () => void;
    isSampleDisabled?: boolean;
}

const CATEGORIES: { id: StoryCategory; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { id: 'DREAM', label: 'Dream', icon: <SparklesIcon className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600 border-purple-100', desc: 'Flights of fancy and nighttime magic.' },
    { id: 'ADVENTURE', label: 'Adventure', icon: <RocketIcon className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600 border-orange-100', desc: 'Daring quests and exciting explorations.' },
    { id: 'MILESTONE', label: 'Milestone', icon: <StarIcon className="w-6 h-6" />, color: 'bg-yellow-50 text-yellow-600 border-yellow-100', desc: 'First steps, lost teeth, and big wins.' },
    { id: 'MEMORY', label: 'Memory', icon: <HeartIcon className="w-6 h-6" />, color: 'bg-red-50 text-red-600 border-red-100', desc: 'Real moments captured forever.' },
    { id: 'IMAGINATION', label: 'Imagination', icon: <PaletteIcon className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600 border-blue-100', desc: 'Anything you can think of!' },
];

export const StoryInputForm: React.FC<StoryInputFormProps> = ({ onSubmit, onAddToCart, onBack, isSampleDisabled }) => {
    const [step, setStep] = useState(1);
    const [input, setInput] = useState<UserInput>({
        category: 'IMAGINATION',
        childName: '',
        childAge: 5,
        childGender: 'Girl',
        characterDescription: '',
        prompt: '',
        pageCount: isSampleDisabled ? 25 : 5
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => s - 1);

    const isStep2Valid = !!input.childName && !!input.childGender;
    const isStep3Valid = !!input.prompt && input.prompt.length > 10 && agreedToTerms;

    // DEBUG: Log validation state if buttons are clicked while disabled
    const handleDisabledClick = () => {
        console.log("🚫 Button clicked while disabled. Validation state:", {
            promptLength: input.prompt.length,
            agreedToTerms,
            isStep3Valid,
            input
        });
        if (!agreedToTerms) alert("Please agree to the terms to continue magical generation.");
        else if (input.prompt.length <= 10) alert("The magic needs a slightly longer prompt (at least 10 characters)!");
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in font-['Nunito']">
            {/* Step Header */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={onBack} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-full shadow-sm transition-all">
                    <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
                </button>
                <div className="flex gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 w-16 rounded-full transition-all duration-700 ${step >= i ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}></div>
                    ))}
                </div>
                <div className="w-12"></div>
            </div>

            {step === 1 && (
                <div className="animate-fade-in-up space-y-10">
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">Choose Your Vibe</h2>
                        <p className="text-slate-500 font-bold text-lg">Pick a theme for your custom coloring story.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setInput({ ...input, category: cat.id }); handleNext(); }}
                                className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center group h-full
                            ${input.category === cat.id ? 'border-indigo-600 bg-indigo-50/50 shadow-2xl scale-105' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl'}
                        `}
                            >
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm ${cat.color}`}>
                                    {cat.icon}
                                </div>
                                <h3 className="font-black text-slate-900 text-lg mb-2">{cat.label}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in-up max-w-2xl mx-auto space-y-10">
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">The Hero</h2>
                        <p className="text-slate-500 font-bold text-lg">Every great story needs a main character.</p>
                    </div>

                    <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Child's Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Maya"
                                    value={input.childName}
                                    onChange={e => setInput({ ...input, childName: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-black bg-white text-slate-900 placeholder:text-slate-200 text-lg transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Age</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={input.childAge}
                                    onChange={e => setInput({ ...input, childAge: parseInt(e.target.value) })}
                                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-black bg-white text-slate-900 text-lg transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Gender</label>
                            <div className="flex gap-4">
                                {['Boy', 'Girl', 'Other'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setInput({ ...input, childGender: g })}
                                        className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 text-lg
                                    ${input.childGender === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-indigo-200 hover:text-slate-600'}
                                `}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Appearance details</label>
                            <textarea
                                placeholder="Curly red hair, likes wearing dinosaur pajamas..."
                                rows={3}
                                value={input.characterDescription}
                                onChange={e => setInput({ ...input, characterDescription: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-black resize-none bg-white text-slate-900 placeholder:text-slate-200 text-lg transition-all"
                            />
                        </div>

                        <div className="pt-6 flex gap-4">
                            <button onClick={handlePrev} className="flex-1 py-4 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-sm">Back</button>
                            <button
                                onClick={handleNext}
                                disabled={!isStep2Valid}
                                className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                            >
                                Next Step
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in-up max-w-2xl mx-auto space-y-10">
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">The Tale</h2>
                        <p className="text-slate-500 font-bold text-lg">What adventure awaits today?</p>
                    </div>

                    <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10">
                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Story Prompt</label>
                            <textarea
                                placeholder="Maya finds a secret door in her room that leads to a kingdom of candy... she helps a gumdrop find his way home."
                                rows={5}
                                value={input.prompt}
                                onChange={e => setInput({ ...input, prompt: e.target.value })}
                                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-black resize-none leading-relaxed bg-white text-slate-900 placeholder:text-slate-200 text-lg transition-all"
                            />
                            <p className="mt-3 text-[10px] text-slate-300 font-black uppercase tracking-widest">At least 10 characters for better magic</p>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Select Length</label>
                            <div className="flex flex-col sm:flex-row gap-5">
                                {[5, 25].map(count => {
                                    const isDisabled = count === 5 && isSampleDisabled;
                                    return (
                                        <button
                                            key={count}
                                            disabled={isDisabled}
                                            onClick={() => setInput({ ...input, pageCount: count })}
                                            className={`flex-1 p-6 rounded-[2rem] font-black border-2 transition-all relative flex flex-col items-center justify-center gap-1
                                                ${input.pageCount === count ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-100 bg-white text-slate-300 hover:border-indigo-200'}
                                                ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                            `}
                                        >
                                            <span className="text-2xl">{count === 5 ? '5 Pages' : '25 Pages'}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                {count === 5 ? (isDisabled ? '1 / Month Used' : 'Free Sample') : 'Complete Book'}
                                            </span>
                                            {count === 25 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] px-4 py-1.5 rounded-full font-black tracking-widest shadow-md">PREMIUM</span>}
                                            {isDisabled && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-[9px] px-4 py-1.5 rounded-full font-black tracking-widest shadow-md">RENEWING SOON</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <button
                                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}
                                >
                                    {agreedToTerms && <CheckIcon className="w-4 h-4 text-white" />}
                                </button>
                                <p className="text-xs font-bold text-slate-600">
                                    I agree to the <span className="underline cursor-pointer hover:text-indigo-600">Terms of Service</span> and understand this story is magically generated.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={handlePrev} className="flex-1 py-4 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-sm">Back</button>
                                <div className="flex-[2] relative">
                                    <button
                                        onClick={() => onSubmit(input)}
                                        disabled={!isStep3Valid}
                                        className={`w-full py-5 text-white rounded-[2rem] font-black text-xl shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3
                                    ${input.pageCount === 25 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}
                                `}
                                    >
                                        <SparklesIcon className="w-6 h-6" />
                                        {input.pageCount === 25 ? 'Pay & Generate' : 'Generate Free Sample'}
                                    </button>
                                    {!isStep3Valid && <div onClick={handleDisabledClick} className="absolute inset-0 cursor-pointer" />}
                                </div>
                            </div>
                            {input.pageCount === 25 && (
                                <div className="relative">
                                    <button
                                        onClick={() => onAddToCart(input)}
                                        disabled={!isStep3Valid}
                                        className="w-full py-4 text-indigo-600 font-black border-2 border-indigo-600 rounded-[2rem] hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                    >
                                        <ShoppingCartIcon className="w-5 h-5" /> Add to Cart (Draft)
                                    </button>
                                    {!isStep3Valid && <div onClick={handleDisabledClick} className="absolute inset-0 cursor-pointer" />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
