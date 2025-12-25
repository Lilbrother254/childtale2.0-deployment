import React from 'react';
import { Story, StoryCategory } from '../types';

interface CoverPreviewProps {
    story: Story;
    showFullSpread?: boolean;
    className?: string;
}

const getThemeColor = (category: StoryCategory): string => {
    switch (category) {
        case 'DREAM': return '#E9D5FF';
        case 'MILESTONE': return '#FEF9C3';
        case 'ADVENTURE': return '#FFEDD5';
        case 'MEMORY': return '#FCE7F3';
        case 'IMAGINATION': return '#DBEAFE';
        default: return '#F1F5F9';
    }
};

const getCategoryLabel = (category: StoryCategory): string => {
    switch (category) {
        case 'DREAM': return "A DREAM STORY";
        case 'MILESTONE': return "A MILESTONE MOMENT";
        case 'ADVENTURE': return "AN ADVENTURE TALE";
        case 'MEMORY': return "A CHERISHED MEMORY";
        case 'IMAGINATION': return "PURE IMAGINATION";
        default: return "A CHILDTALE STORY";
    }
};

export const CoverPreview: React.FC<CoverPreviewProps> = ({ story, showFullSpread = false, className = "" }) => {
    const bgColor = getThemeColor(story.category);
    const label = getCategoryLabel(story.category);
    const author = story.authorName || "ChildTale";
    const fullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;

    // Hardcover specs simulation
    const spineWidth = Math.max(0.25, (story.pageCount || 25) / 426); // Simulating PPI from pdfGenerator
    const hasSpineText = (story.pageCount || 25) >= 80;

    if (showFullSpread) {
        return (
            <div className={`relative bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 transition-all ${className}`} style={{ aspectRatio: '19/12.75' }}>
                <div className="absolute inset-0 flex" style={{ backgroundColor: bgColor }}>
                    {/* Back Cover */}
                    <div className="flex-1 relative flex flex-col items-center justify-center p-8 border-r border-black/5">
                        <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 mb-4">CT</div>

                        {/* ISBN Barcode Placeholder */}
                        <div className="absolute bottom-4 right-4 w-[18%] aspect-[3.625/1.25] bg-white border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-mono">
                            ISBN BARCODE
                        </div>
                    </div>

                    {/* Spine */}
                    <div className="h-full bg-black/5" style={{ width: `${(spineWidth / 19) * 100}%` }}>
                        {hasSpineText && (
                            <div className="h-full flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap tracking-widest transform rotate-90 origin-center">
                                    {story.title}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Front Cover */}
                    <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
                        <div className="relative z-10 text-center flex flex-col items-center">
                            <span className="text-[10px] font-black tracking-[0.2em] text-black/40 mb-4 uppercase">{label}</span>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4 drop-shadow-sm font-['Nunito']">
                                {fullTitle}
                            </h1>
                            <p className="text-sm font-bold text-slate-600 mb-8">By {author}</p>
                        </div>

                        {story.coverImage && (
                            <div className="w-3/4 aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                <img src={story.coverImage} className="w-full h-full object-cover" alt="Cover" />
                            </div>
                        )}

                        {/* Premium Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                    </div>
                </div>
            </div>
        );
    }

    // 3D Mockup View
    return (
        <div className={`perspective-1000 ${className}`}>
            <div className="relative transition-transform duration-700 hover:book-rotate-tilt transform-style-3d group" style={{ width: '300px', height: '388px' }}>
                {/* Book Front */}
                <div className="absolute inset-0 rounded-r-lg shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6 z-20 backface-hidden" style={{ backgroundColor: bgColor }}>
                    <div className="relative z-10 text-center flex flex-col items-center">
                        <span className="text-[8px] font-black tracking-[0.2em] text-black/40 mb-2 uppercase">{label}</span>
                        <h1 className="text-xl font-black text-slate-900 leading-tight mb-3 font-['Nunito']">
                            {fullTitle}
                        </h1>
                        <p className="text-xs font-bold text-slate-600 mb-4 italic">By {author}</p>
                    </div>

                    {story.coverImage && (
                        <div className="w-4/5 aspect-square rounded-xl overflow-hidden shadow-md border-2 border-white">
                            <img src={story.coverImage} className="w-full h-full object-cover" alt="Cover" />
                        </div>
                    )}

                    {/* Spine Edge Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent" />

                    {/* CT Logo Small */}
                    <div className="absolute bottom-4 opacity-30 text-[8px] font-bold tracking-tighter">CHILDTALE PREMIUM</div>
                </div>

                {/* Book Spine (3D Effect) */}
                <div className="absolute top-0 bottom-0 w-8 bg-slate-200 origin-left book-spine-rotate translate-x-0 z-10 shadow-inner" style={{ backgroundColor: bgColor, filter: 'brightness(0.9)' }}>
                    {hasSpineText && (
                        <div className="h-full flex items-center justify-center">
                            <span className="text-[8px] font-bold text-slate-600 uppercase whitespace-nowrap tracking-widest transform rotate-90 w-full text-center">
                                {story.title}
                            </span>
                        </div>
                    )}
                </div>

                {/* Pages (Stack effect) */}
                <div className="absolute top-[2px] bottom-[2px] right-[-10px] w-4 bg-white rounded-r-sm shadow-sm border-r border-slate-200 z-10 flex flex-col justify-around py-4">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-[1px] w-full bg-slate-100" />)}
                </div>
            </div>
        </div>
    );
};
