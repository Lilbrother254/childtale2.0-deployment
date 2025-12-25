
import React, { useState } from 'react';
import { Story } from '../types';

import { generateVectorPDF } from '../utils/pdfGenerator';
import { BookIcon, XIcon, PlusIcon, ClockIcon, AlertTriangleIcon, RefreshIcon, CoinsIcon, ArrowLeftIcon, SparklesIcon, ShareIcon, StarIcon } from './Icons';

interface LibraryPageProps {
    stories: Story[];
    onOpenStory: (story: Story) => void;
    onDeleteStory: (id: string) => void;
    onShareStory: (story: Story) => void;
    onRegenerate: (story: Story) => void;
    onCreateNew: () => void;
    onBack: () => void;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
    stories,
    onOpenStory,
    onDeleteStory,
    onShareStory,
    onRegenerate,
    onCreateNew,
    onBack,
    isLoading = false,
    hasMore = false,
    onLoadMore
}) => {
    const [activeTab, setActiveTab] = useState<'completed' | 'generating' | 'drafts'>('completed');
    const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

    const checkDelete = (e: React.MouseEvent, story: Story) => {
        e.stopPropagation();
        setStoryToDelete(story);
    };

    const confirmDelete = () => {
        if (storyToDelete) {
            onDeleteStory(storyToDelete.id);
            setStoryToDelete(null);
        }
    };

    const completedStories = stories.filter(s => s.status === 'completed');
    const generatingStories = stories.filter(s => s.status === 'generating');
    const draftStories = stories.filter(s => s.status === 'failed' || s.status === 'draft');

    const renderEmptyState = (msg: string, sub: string) => (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <BookIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{msg}</h3>
            <p className="text-slate-400 font-bold mb-8">{sub}</p>
            <button onClick={onCreateNew} className="text-indigo-600 font-black uppercase tracking-widest text-xs hover:underline">Start a new tale</button>
        </div>
    );

    if (isLoading) {
        return (
            <div className="animate-fade-in pb-12">
                <div className="flex items-center justify-between mb-12">
                    <div className="w-20 h-4 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="w-40 h-12 bg-slate-200 rounded-full animate-pulse"></div>
                </div>
                <div className="w-64 h-16 bg-slate-200 rounded-3xl mb-10 animate-pulse"></div>
                <div className="flex gap-4 mb-12">
                    <div className="w-40 h-14 bg-slate-200 rounded-[1.5rem] animate-pulse"></div>
                    <div className="w-40 h-14 bg-slate-200 rounded-[1.5rem] animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="aspect-[3/4] bg-slate-100 animate-pulse"></div>
                            <div className="p-8 space-y-4">
                                <div className="w-full h-8 bg-slate-100 rounded-xl animate-pulse"></div>
                                <div className="flex justify-between">
                                    <div className="w-20 h-4 bg-slate-100 rounded-full animate-pulse"></div>
                                    <div className="w-16 h-4 bg-slate-100 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-12">
                <button
                    onClick={onBack}
                    className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                    <button onClick={onCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 sm:gap-3 transition-all hover:-translate-y-1">
                        <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>New Tale</span>
                    </button>
                </div>
            </div>

            <h2 className="text-5xl font-black text-slate-900 mb-10 tracking-tight">My Library</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12 bg-slate-100 p-2 rounded-[2rem] w-full md:w-fit shadow-inner">
                <button onClick={() => setActiveTab('completed')} className={`px-6 md:px-8 py-3 md:py-3.5 rounded-[1.5rem] font-black text-[11px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Completed ({completedStories.length})</button>
                <button onClick={() => setActiveTab('generating')} className={`px-6 md:px-8 py-3 md:py-3.5 rounded-[1.5rem] font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'generating' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Generating ({generatingStories.length})</button>
                <button onClick={() => setActiveTab('drafts')} className={`px-6 md:px-8 py-3 md:py-3.5 rounded-[1.5rem] font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'drafts' ? 'bg-white text-red-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Safety Net ({draftStories.length})</button>
            </div>

            {activeTab === 'completed' && (
                <>
                    {completedStories.length === 0 ? renderEmptyState("No finished stories yet", "The magic is just a few clicks away.") : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                            {completedStories.map((story) => (
                                <div key={story.id} onClick={() => onOpenStory(story)} className="group bg-white rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-700 cursor-pointer border border-slate-100 overflow-hidden hover:-translate-y-3 relative">
                                    <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden">
                                        <img src={story.pages[0]?.coloredImageUrl || story.coverImage} alt={story.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />

                                        <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={(e) => checkDelete(e, story)} className="p-3 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 transition-all shadow-xl hover:scale-110"><XIcon className="w-5 h-5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onShareStory(story); }} className="p-3 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-indigo-600 transition-all shadow-xl hover:scale-110"><ShareIcon className="w-5 h-5" /></button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDownloadProgress(0);
                                                    const pdfInput = {
                                                        category: story.category,
                                                        childName: story.childName,
                                                        childAge: story.childAge,
                                                        childGender: story.childGender,
                                                        characterDescription: story.characterDescription || '',
                                                        prompt: story.originalPrompt || '',
                                                        pageCount: story.pageCount,
                                                        subtitle: story.subtitle,
                                                        authorName: story.authorName,
                                                        isbn: story.isbn,
                                                        description: story.description,
                                                        keywords: story.keywords,
                                                        copyrightYear: story.copyrightYear
                                                    };
                                                    generateVectorPDF(story, pdfInput, (p) => setDownloadProgress(p)).finally(() => setDownloadProgress(null));
                                                }}
                                                className="p-3 bg-fuchsia-600 text-white rounded-full transition-all shadow-xl hover:scale-110 hover:bg-fuchsia-500 font-black text-[10px] tracking-widest flex items-center justify-center gap-1"
                                                title="Download Print-Ready Vector PDF (Infinite Resolution)"
                                            >
                                                <span className="hidden group-hover:block transition-all mr-1 whitespace-nowrap">VECTOR PDF</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </button>

                                            {!story.hasBeenRegenerated && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onRegenerate(story); }}
                                                    className={`p-3 backdrop-blur rounded-full transition-all shadow-xl hover:scale-110 ${!story.hasBeenRegenerated ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white/90 text-slate-400 hover:text-yellow-600'}`}
                                                    title={!story.hasBeenRegenerated ? "Free Magic Redo (1 included per book)" : "Regenerate"}
                                                >
                                                    <RefreshIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        {story.pageCount === 5 && (
                                            <div className="absolute top-6 left-6 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Free Sample</div>
                                        )}
                                        {story.isPurchased && story.pageCount > 5 && (
                                            <div className="absolute top-6 left-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                                <StarIcon className="w-3 h-3 text-yellow-300" />
                                                Digital + Hardcover Unlocked
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8">
                                        <h3 className="font-black text-2xl text-slate-900 leading-tight mb-3 line-clamp-2">{story.title}</h3>
                                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl">{story.pageCount} Pages</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasMore && onLoadMore && (
                        <div className="mt-16 flex justify-center">
                            <button
                                onClick={onLoadMore}
                                className="group relative px-10 py-4 bg-white border-2 border-slate-200 rounded-full font-black text-xs uppercase tracking-[0.2em] text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 group-hover:animate-spin" />
                                    Load More Magic
                                </span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'generating' && (
                generatingStories.length === 0 ? renderEmptyState("No tales are weaving", "Everything you start will appear here.") : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        {generatingStories.map(story => (
                            <div key={story.id} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-indigo-50 relative overflow-hidden flex flex-col items-center text-center group">
                                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform">
                                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-[2rem]"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-[2rem] border-t-transparent animate-spin"></div>
                                    <ClockIcon className="w-10 h-10 text-indigo-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Weaving Your Magic</h3>
                                <p className="text-sm font-bold text-slate-400 mb-8 tracking-wide uppercase">{story.title || "Your Secret Story"}</p>
                                <div className="w-full space-y-4">
                                    {/* Live Magic Grid */}
                                    <div className="grid grid-cols-5 gap-1 md:gap-2 mb-4">
                                        {(story.pages || []).filter(p => p.imageUrl).slice(0, 10).map((page, idx) => (
                                            <div key={idx} className="aspect-[3/4] bg-indigo-50 rounded-lg overflow-hidden border border-indigo-100 shadow-sm animate-fade-in relative group">
                                                <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                        ))}
                                        {/* Placeholder for next page */}
                                        {story.status === 'generating' && (
                                            <div className="aspect-[3/4] bg-indigo-50/50 rounded-lg border border-dashed border-indigo-200 flex items-center justify-center animate-pulse">
                                                <SparklesIcon className="w-4 h-4 text-indigo-300" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${story.progress || 0}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                        <span>{(story.pages || []).filter(p => p.imageUrl).length} / {story.pageCount || 25} Pages Ready</span>
                                        <span>Magic in progress...</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'drafts' && (
                draftStories.length === 0 ? renderEmptyState("Your safety net is empty", "We keep all incomplete works here just in case.") : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        {draftStories.map(story => (
                            <div key={story.id} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-red-50 relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8">
                                    <AlertTriangleIcon className="w-12 h-12 text-red-400" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Magic Paused</h3>
                                <p className="text-sm font-bold text-slate-400 mb-10 max-w-[220px]">Something interrupted the weaving process.</p>
                                <button onClick={() => onRegenerate(story)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    <RefreshIcon className="w-5 h-5" /> Retry Now
                                </button>
                                <button onClick={(e) => checkDelete(e, story)} className="mt-6 text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] hover:text-red-400 transition-colors">Discard Draft</button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {storyToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl scale-100 animate-fade-in-up">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangleIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Delete Story?</h3>
                        <p className="text-slate-500 font-bold text-center mb-8 text-sm">
                            Are you sure you want to delete <span className="text-slate-900">"{storyToDelete.title}"</span>? This gets rid of it forever and cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStoryToDelete(null)}
                                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-xl transition-all"
                            >
                                Delete It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {downloadProgress !== null && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl scale-100 flex flex-col items-center text-center animate-pulse">
                        <div className="w-20 h-20 bg-fuchsia-50 rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 border-4 border-fuchsia-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-fuchsia-600 rounded-full border-t-transparent animate-spin"></div>
                            <SparklesIcon className="w-8 h-8 text-fuchsia-600" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2">Preparing Print Magic</h3>
                        <p className="text-slate-500 font-bold mb-8">Upgrading to Infinite Resolution...</p>

                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-fuchsia-600 transition-all duration-300 ease-out" style={{ width: `${downloadProgress}%` }}></div>
                        </div>
                        <p className="text-xs font-black text-fuchsia-600 uppercase tracking-widest">{downloadProgress}% COMPLETE</p>
                    </div>
                </div>
            )}
        </div>
    );
};
