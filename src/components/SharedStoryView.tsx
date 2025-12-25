
import React, { useState } from 'react';
import { Story } from '../../types';
import { ChildTaleLogo } from '../../components/Branding';
import { SparklesIcon, ArrowLeftIcon, PaletteIcon, HeartIcon, BookIcon, ShareIcon } from '../../components/Icons';
import { ColoringInterface } from '../../components/ColoringInterface';
import { supabaseService } from '../../services/supabaseService';

interface SharedStoryViewProps {
    story: Story;
    mode: 'view' | 'collab';
}

export const SharedStoryView: React.FC<SharedStoryViewProps> = ({ story: initialStory, mode }) => {
    const [story, setStory] = useState(initialStory);
    const [activePageIndex, setActivePageIndex] = useState<number | null>(null);

    const handleOpenColoring = (pageIndex: number) => {
        setActivePageIndex(pageIndex);
    };

    // We need a local save handler for collab mode since extracting this means we lose the top-level contexts
    // But Shared View usually implies "Anonymous" or "External" access, so they might not be logged in.
    // If they ARE logged in, we ideally want to sync.
    // For now, let's keep the logic simple: direct Supabase call if in collab mode? 
    // Wait, the original App.tsx used `handleSaveColoring` which required `user` auth or at least owner ID.
    // Collab mode requires careful perm handling. 
    // Given the constraints, let's replicate the structure but assume public/anon write access is handled by RLS if allowed,
    // or just allow saving if the token permits.
    const handleSaveColoring = async (dataUrl: string) => {
        if (activePageIndex === null) return;
        try {
            const bookId = story.id;
            const ownerId = story.userId;
            const pageNum = story.pages[activePageIndex].pageNumber;
            // Note: uploading to another user's folder might fail if RLS forbids it without a special token.
            // Assuming RLS allows it for now based on previous code.
            const rawUrl = await supabaseService.uploadImage(ownerId, bookId, pageNum, dataUrl, true);
            const coloredUrl = `${rawUrl}?t=${Date.now()}`;

            await supabaseService.updatePageColor(bookId, pageNum, rawUrl);

            // Update Local State
            setStory(prev => ({
                ...prev,
                coverImage: pageNum === 1 ? coloredUrl : prev.coverImage,
                pages: prev.pages.map(p => p.pageNumber === pageNum ? { ...p, coloredImageUrl: coloredUrl } : p)
            }));
            setActivePageIndex(null);
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save. You might need to be logged in.");
        }
    };

    return (
        <div className="min-h-screen bg-white font-['Nunito'] pb-32 relative">
            <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6">
                <div onClick={() => window.location.href = window.location.origin} className="cursor-pointer">
                    <ChildTaleLogo size="sm" />
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${mode === 'collab' ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {mode === 'collab' ? 'Collaboration Mode' : 'View Only Mode'}
                    </span>
                    <button onClick={() => window.location.href = window.location.origin} className="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest outline outline-offset-2 outline-slate-900/10">Get ChildTale</button>
                </div>
            </nav>

            {/* Sticky Magic Invitation Pill */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xs px-4 animate-bounce-soft">
                <button
                    onClick={() => window.location.href = window.location.origin}
                    className="w-full bg-slate-900/90 backdrop-blur-xl text-white py-4 px-6 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-between group hover:scale-105 transition-all outline outline-offset-4 outline-slate-900/10"
                >
                    <span className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                        Start Your Story
                    </span>
                    <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                </button>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-32">
                <div className="text-center mb-24 max-w-3xl mx-auto space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-none tracking-tight animate-gradient-text">
                        {story.title}
                    </h1>
                    <p className="text-slate-600 font-bold text-lg md:text-xl">A magical journey shared by a friend for {story.childName}</p>
                </div>

                {/* Story Pages */}
                <div className="grid grid-cols-1 gap-32 max-w-4xl mx-auto mt-20">
                    {story.pages.map((page, idx) => (
                        <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20 group`}>
                            <div className="w-full md:w-1/2">
                                <div className="bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-100 relative group overflow-hidden">
                                    <div className="aspect-[3/4] rounded-[1.8rem] overflow-hidden bg-slate-50 relative">
                                        <img
                                            src={mode === 'collab' ? (page.coloredImageUrl || page.imageUrl) : page.imageUrl}
                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                                            alt="Page"
                                        />
                                        {mode === 'collab' && (
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleOpenColoring(idx)}
                                                    className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                                                >
                                                    <PaletteIcon className="w-4 h-4" /> Color This Page
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <span className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100">{idx + 1}</span>
                                    <div className="h-px w-20 bg-slate-100 hidden md:block"></div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold leading-tight text-slate-800">{page.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Curtain Close - Premium Marketing Section */}
                <div className="mt-48 text-center space-y-16">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                    <div className="space-y-6">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">The Magic is Real.</h2>
                        <p className="text-slate-600 font-bold text-xl max-w-2xl mx-auto">Create a custom hardcover story starring your child in 3 easy steps.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { icon: HeartIcon, title: "Describe", text: "Tell us about your child's favorite things." },
                            { icon: SparklesIcon, title: "Weave", text: "ChildTale writes and sketches the adventure." },
                            { icon: BookIcon, title: "Print", text: "Receive a premium hardcover keepsake." }
                        ].map((step, i) => (
                            <div key={i} className="bg-slate-50 p-10 rounded-[3rem] space-y-4 hover:scale-105 transition-all">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                    <step.icon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900">{step.title}</h4>
                                <p className="text-slate-600 font-bold text-sm leading-relaxed">{step.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-600 rounded-[4rem] p-16 text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="relative z-10 space-y-8">
                            <h3 className="text-4xl md:text-5xl font-black leading-none">Ready to start the magic?</h3>
                            <p className="text-indigo-100 font-bold text-lg opacity-90 max-w-md mx-auto">Join thousands of parents weaving memories today.</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <button
                                    onClick={() => window.location.href = window.location.origin}
                                    className="bg-white text-indigo-600 px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Create Story Now
                                </button>
                                <button
                                    onClick={() => {
                                        const text = `I just saw a magical story on ChildTale! You have to check this out: ${window.location.href}`;
                                        navigator.clipboard.writeText(text);
                                        alert("Reaction copied to clipboard! Share it with a friend.");
                                    }}
                                    className="bg-indigo-700/50 backdrop-blur-md text-white border-2 border-white/20 px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <ShareIcon className="w-5 h-5" /> Share Reaction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {activePageIndex !== null && (
                <div className="fixed inset-0 z-[100]">
                    <ColoringInterface
                        imageUrl={story.pages[activePageIndex].imageUrl || ''}
                        initialState={story.pages[activePageIndex].coloredImageUrl}
                        onSave={handleSaveColoring}
                        onClose={() => setActivePageIndex(null)}
                        isViralCTA={true}
                    />
                </div>
            )}
        </div>
    );
};
