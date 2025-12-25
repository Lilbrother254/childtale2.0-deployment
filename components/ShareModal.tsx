
import React, { useState } from 'react';
import { XIcon, CheckIcon, LinkIcon, UsersIcon, EyeIcon, SparklesIcon, PaletteIcon } from './Icons';
import { Story } from '../types';
import { supabaseService } from '../services/supabaseService';

interface ShareModalProps {
    story: Story;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ story, onClose }) => {
    const [activeTab, setActiveTab] = useState<'view' | 'collab'>('view');
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
        // Ensure story is public when sharing modal is opened
        if (story.id) {
            supabaseService.setBookPublic(story.id, true);
        }
    }, [story.id]);

    const baseUrl = window.location.origin;
    const shareId = story.id;

    // Construct URLs (Added SHARE10 promo to help convert visitors)
    const viewUrl = `${baseUrl}?share=${shareId}&promo=SHARE10`;
    const collabUrl = `${baseUrl}?share=${shareId}&mode=collab&promo=SHARE10`;

    const currentUrl = activeTab === 'view' ? viewUrl : collabUrl;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const text = activeTab === 'collab'
            ? `Hey! Let's color this story for ${story.childName} together on ChildTale! 🎨 Join the fun here: ${currentUrl}`
            : `Check out the custom coloring book story I made for ${story.childName} on ChildTale! 📚 Read it here: ${currentUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col animate-pop-in">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 rounded-full transition-colors z-10"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                <div className="p-8 text-center border-b border-slate-50 bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                        <SparklesIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Share Magic</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1 line-clamp-1">"{story.title}"</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
                        <button
                            onClick={() => { setActiveTab('view'); setCopied(false); }}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'view' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <EyeIcon className="w-4 h-4" /> Read Only
                        </button>
                        <button
                            onClick={() => { setActiveTab('collab'); setCopied(false); }}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'collab' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <UsersIcon className="w-4 h-4" /> Collab
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                {activeTab === 'view' ? 'Perfect for showing off' : 'Perfect for twins & sleepovers'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-400 truncate select-all">
                                    {currentUrl}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    {copied ? <CheckIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {activeTab === 'collab' && (
                            <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                                <PaletteIcon className="w-6 h-6 text-pink-600 shrink-0" />
                                <p className="text-xs font-bold text-pink-700 leading-relaxed">
                                    <strong>Note:</strong> Anyone with this link can color the pages of this book. Their progress will be shared in real-time.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleWhatsApp}
                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-100 transform active:scale-95"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Send to WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
