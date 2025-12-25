
import React, { useState } from 'react';
import { Story } from '../types';
import { PaletteIcon, ArrowLeftIcon, BrushIcon, CheckIcon, StarIcon, SparklesIcon, DownloadIcon, EyeIcon } from './Icons';
import { CoverPreview } from './CoverPreview';

interface MagicStudioPageProps {
    stories: Story[];
    onOpenColoring: (story: Story, pageIndex: number) => void;
    onDownloadBook: (story: Story) => void;
    onCreateNew: () => void;
    onBack: () => void;
    initialBookId?: string | null;
    isLoading?: boolean;
}

export const MagicStudioPage: React.FC<MagicStudioPageProps> = ({
    stories,
    onOpenColoring,
    onDownloadBook,
    onCreateNew,
    onBack,
    initialBookId,
    isLoading = false
}) => {
    // Use book ID to prevent stale state issues when the parent 'stories' list updates
    const [selectedBookId, setSelectedBookId] = useState<string | null>(initialBookId || null);
    const [viewMode, setViewMode] = useState<'pages' | 'cover'>('pages');

    // Derive the selected book from the master stories list
    const selectedBook = stories.find(s => s.id === selectedBookId);

    // Filter only completed stories
    const studioReadyStories = stories.filter(s => s.status === 'completed');

    if (isLoading) {
        return (
            <div className="animate-fade-in pb-12">
                <div className="w-20 h-4 bg-slate-200 rounded-full mb-6 animate-pulse"></div>
                <div className="w-full h-64 bg-slate-200 rounded-[2.5rem] mb-10 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm">
                            <div className="aspect-square bg-slate-100 rounded-[1.5rem] mb-4 animate-pulse"></div>
                            <div className="px-2 space-y-3">
                                <div className="w-3/4 h-6 bg-slate-100 rounded-lg animate-pulse"></div>
                                <div className="w-1/2 h-4 bg-slate-100 rounded-md animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // VIEW 1: BOOK SELECTION (THE GALLERY)
    if (!selectedBook) {
        return (
            <div className="animate-fade-in pb-12">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 mb-6 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white mb-10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                        <PaletteIcon className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/30">Creative Zone</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight font-['Nunito']">
                            Magical Studio
                        </h1>
                        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl font-medium">
                            Select a story to open your digital art supplies. No mess, just magic.
                        </p>
                    </div>
                </div>

                {/* Grid */}
                {studioReadyStories.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BrushIcon className="w-12 h-12 text-indigo-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-2">Your Studio is Empty!</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Create a story first. Once it's generated, it will appear here ready to color.</p>
                        <button onClick={onCreateNew} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                            <SparklesIcon className="w-5 h-5" /> Create a Story
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {studioReadyStories.map((story) => (
                            <div
                                key={story.id}
                                className="group bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                onClick={() => setSelectedBookId(story.id)}
                            >
                                <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-100 relative mb-4">
                                    <img
                                        src={story.pages[0]?.coloredImageUrl || story.pages[0]?.imageUrl}
                                        alt={story.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-xl transform scale-90 group-hover:scale-100 transition-transform flex items-center gap-2">
                                            <PaletteIcon className="w-5 h-5 text-indigo-600" /> Enter Studio
                                        </span>
                                    </div>
                                </div>
                                <div className="px-2 pb-2">
                                    <h3 className="font-bold text-xl text-slate-900 leading-tight mb-1 truncate">{story.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs font-bold">{story.pageCount} Pages</span>
                                        <span>•</span>
                                        <span>{story.childName}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // VIEW 2: PAGE SELECTION (INSIDE THE BOOK)
    return (
        <div className="animate-fade-in pb-12">
            {/* Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedBookId(null)}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{selectedBook.title}</h2>
                        <p className="text-slate-500 font-bold text-xs sm:text-sm">Select a page to start coloring</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'pages' ? 'cover' : 'pages')}
                        className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-full font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        {viewMode === 'pages' ? <EyeIcon className="w-5 h-5" /> : <BrushIcon className="w-5 h-5" />}
                        <span>{viewMode === 'pages' ? 'Preview Cover' : 'View Pages'}</span>
                    </button>
                    <button
                        onClick={() => onDownloadBook(selectedBook)}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Download Book</span>
                    </button>
                </div>
            </div>

            {viewMode === 'cover' ? (
                <div className="flex flex-col items-center justify-center py-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl w-full px-4">
                        {/* 3D Mockup */}
                        <div className="flex-1 flex flex-col items-center">
                            <h3 className="text-xl font-bold text-slate-800 mb-8 border-b-2 border-indigo-100 pb-2">3D Hardcover Mockup</h3>
                            <CoverPreview story={selectedBook} className="scale-110" />
                        </div>

                        {/* Info / Distribution Check */}
                        <div className="flex-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-indigo-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <StarIcon className="w-24 h-24 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-6 font-['Nunito']">Distribution Quality</h3>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckIcon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">ISBN Ready</p>
                                        <p className="text-xs text-slate-500">Barcode area is set to retail standards (3.625" x 1.25").</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckIcon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Case-Wrap Alignment</p>
                                        <p className="text-xs text-slate-500">Fold-over (Wrap) margins are optimized for 8.5x11 hardcover.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckIcon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Spine Integrity</p>
                                        <p className="text-xs text-slate-500">Spine text is {selectedBook.pageCount && selectedBook.pageCount >= 80 ? 'active' : 'disabled'} for your {selectedBook.pageCount || 25} page book.</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                                    <SparklesIcon className="w-4 h-4 inline mr-1" /> This preview uses real-time Lulu specifications. What you see is a digital twin of your physical book.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Full Spread View */}
                    <div className="w-full max-w-6xl px-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-8 border-b-2 border-indigo-100 pb-2 text-center md:text-left">Full Print Spread (Flat)</h3>
                        <CoverPreview story={selectedBook} showFullSpread={true} />
                    </div>
                </div>
            ) : (
                /* Pages Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {selectedBook.pages.map((page, index) => (
                        <div
                            key={index}
                            onClick={() => onOpenColoring(selectedBook, index)}
                            className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all"
                        >
                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 relative border border-slate-100">
                                <img
                                    src={page.coloredImageUrl || page.imageUrl}
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-full object-contain p-2"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors flex items-center justify-center">
                                    {/* Color Now Button - Always visible on hover */}
                                    <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                                        <BrushIcon className="w-4 h-4" /> Color Now
                                    </button>
                                </div>

                                {/* Status Indicators */}
                                <div className="absolute top-2 left-2">
                                    <span className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-sm font-bold text-slate-500 shadow-sm">
                                        {index + 1}
                                    </span>
                                </div>
                                {page.coloredImageUrl && (
                                    <div className="absolute top-2 right-2">
                                        <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md">
                                            <CheckIcon className="w-4 h-4" />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
