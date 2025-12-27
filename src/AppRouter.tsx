import React, { useState, useEffect } from 'react';
import { AppState, UserInput, Story } from '../types';
import { useAuth } from './contexts/AuthContext';
import { useStory } from './contexts/StoryContext';
import { useCart } from './contexts/CartContext';

// Pages & Components
import { LandingPage } from '../components/LandingPage';
import { StoryInputForm } from '../components/StoryInputForm';
import { LibraryPage } from '../components/LibraryPage';
import { MagicStudioPage } from '../components/MagicStudioPage';
import { CartPage } from '../components/CartPage';
import { PricingPage } from '../components/PricingPage';
import { AccountDropdown } from '../components/ProfilePage';
import { ChildTaleLogo } from '../components/Branding';
import { ShoppingCartIcon, MenuIcon, SparklesIcon, PlusIcon, LibraryIcon, PaletteIcon, LogOutIcon, ShareIcon, ArrowLeftIcon, HeartIcon, BookIcon, XIcon } from '../components/Icons';
import { PaymentModal } from '../components/PaymentModal';
import { ShareModal } from '../components/ShareModal';
import { ColoringInterface } from '../components/ColoringInterface';
import { generateHomePrintPDF } from '../utils/pdfGenerator';
import { supabaseService } from '../services/supabaseService';
import { SharedStoryView } from './components/SharedStoryView';

export const AppRouter: React.FC = () => {
    const { user, logout, deleteAccount, refreshProfile } = useAuth();
    const { stories, activeStory, setActiveStory, generateStory, isGenerating, isInitialLoading, generationProgress, deleteStory, regenerateStory, saveColoringPage, hydrateStory, loadMore, hasMore } = useStory();
    const { cart, addToCart, removeFromCart, updateItemType, clearCart } = useCart();

    const [appState, setAppState] = useState<AppState>(AppState.INPUT);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState<Story | null>(null);
    const [activeColoringPage, setActiveColoringPage] = useState<number | null>(null);

    // FIX: Persist pendingInput to survive refresh during checkout
    const [pendingInput, setPendingInputState] = useState<UserInput | null>(() => {
        const saved = sessionStorage.getItem('ct_pending_input');
        return saved ? JSON.parse(saved) : null;
    });

    const setPendingInput = (input: UserInput | null) => {
        setPendingInputState(input);
        if (input) sessionStorage.setItem('ct_pending_input', JSON.stringify(input));
        else sessionStorage.removeItem('ct_pending_input');
    };

    // FIX: Persist checkoutStoryId to survive Auth/Context refreshes
    const [checkoutStoryId, setCheckoutStoryIdState] = useState<string | null>(() => {
        return sessionStorage.getItem('ct_checkout_story_id');
    });
    const setCheckoutStoryId = (id: string | null) => {
        console.log("💳 Setting Checkout Story ID:", id);
        setCheckoutStoryIdState(id);
        if (id) sessionStorage.setItem('ct_checkout_story_id', id);
        else sessionStorage.removeItem('ct_checkout_story_id');
    };

    const [isSampleDisabled, setIsSampleDisabled] = useState(false);

    // Deep Link Check
    const [sharedStory, setSharedStory] = useState<{ story: Story, mode: 'view' | 'collab' } | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shareId = params.get('share');
        if (shareId) {
            supabaseService.getPublicStory(shareId).then(s => {
                if (s) setSharedStory({ story: s, mode: (params.get('mode') as any) || 'view' });
            });
        }
    }, []);

    useEffect(() => {
        if (user) {
            supabaseService.hasReachedMonthlySampleLimit(user.id).then(setIsSampleDisabled);
        }
    }, [user, stories]);

    // --- Actions ---
    const handleInputSubmit = async (input: UserInput) => {
        console.log("🚀 handleInputSubmit triggered:", { input, userId: user?.id });
        if (!user) {
            console.error("❌ No user found in handleInputSubmit");
            return;
        }

        if (input.pageCount === 25) {
            console.log("💎 Processing paid book (25 pages)...");
            try {
                console.log("⏳ Pre-creating book shell...");
                const bookId = await supabaseService.createBook(user.id, input, `${input.childName}'s Adventure`);
                console.log("✅ Book shell created with ID:", bookId);

                const shellStory: Story = {
                    id: bookId,
                    userId: user.id,
                    createdAt: new Date().toISOString(),
                    title: `${input.childName}'s Adventure`,
                    pages: [],
                    category: input.category,
                    status: 'draft',
                    isPurchased: false,
                    hasBeenRegenerated: false,
                    pageCount: input.pageCount,
                    childName: input.childName,
                    childAge: input.childAge,
                    childGender: input.childGender,
                    characterDescription: input.characterDescription,
                    originalPrompt: input.prompt
                };

                setActiveStory(shellStory);
                setCheckoutStoryId(bookId);
                setPendingInput(input);
                setShowPaymentModal(true);
            } catch (err: any) {
                console.error("❌ Failed to pre-create book shell:", err);
                alert(err.message || "Could not start checkout. Please try again.");
                throw err; // Re-throw to reset form loading state
            }
        } else {
            console.log("🎁 Processing free sample (5 pages)...");
            if (isSampleDisabled) {
                console.warn("⚠️ Sample limit reached");
                alert("You've used your free sample this month! Upgrade to a full book.");
                setAppState(AppState.PRICING);
                return;
            }
            setAppState(AppState.GENERATING_STORY);
            console.log("🪄 Calling generateStory...");
            generateStory(input).then(() => {
                console.log("✅ Generation complete, switching to PREVIEW");
                setAppState(AppState.PREVIEW);
            }).catch(err => {
                console.error("❌ Generation failed:", err);
                setAppState(AppState.LIBRARY);
            });
        }
    };

    const handlePaymentSuccess = async (type: 'digital' | 'print' | 'cart') => {
        console.log("🎖️ Payment Success Handler Triggered:", type);
        setShowPaymentModal(false);

        // Capture IDs before clearing
        const capturedBookId = activeStory?.id || checkoutStoryId;

        // Clear references
        setCheckoutStoryId(null);

        if (type === 'cart') {
            console.log("🛒 Clearing cart after checkout...");
            clearCart();
            // After cart checkout, we should go to Library to see all new books
            setAppState(AppState.LIBRARY);
            return;
        }

        if (pendingInput) {
            console.log("🚀 Starting generation from pending input...");
            setAppState(AppState.GENERATING_STORY);
            generateStory(pendingInput, capturedBookId || undefined).then(() => {
                setPendingInput(null);
                setAppState(AppState.PREVIEW);
            }).catch(err => {
                console.error("❌ Checkout-triggered generation failed:", err);
                setAppState(AppState.LIBRARY);
            });
        } else {
            console.log("📚 Transitioning to Library...");
            setAppState(AppState.LIBRARY);
        }
    };

    const handleOpenColoring = (story: Story, pageIndex: number) => {
        setActiveStory(story);
        setActiveColoringPage(pageIndex);
    };

    // --- Render Logic ---

    // 1. Shared Story View (Public)
    if (sharedStory) {
        return <SharedStoryView key="shared-view" story={sharedStory.story} mode={sharedStory.mode} />;
    }

    // 2. Main Switcher - Ensures mutual exclusivity
    return (
        <>
            {!user ? (
                <LandingPage
                    key="landing-page"
                    user={user}
                    onLogout={logout}
                    onLogin={() => { refreshProfile(); }}
                />
            ) : (
                <div key="app-main" className="min-h-screen bg-slate-50 font-['Nunito']">
                    {/* HEADER - Standardized to match LandingPage style */}
                    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/98 backdrop-blur-md border-b border-slate-100 z-50 transition-all duration-300">
                        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                            <div className="flex items-center gap-10">
                                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600">
                                    {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                                </button>
                                <div onClick={() => setAppState(AppState.INPUT)} className="cursor-pointer">
                                    <ChildTaleLogo size="sm" />
                                </div>

                                {/* Desktop Nav - Simplified */}
                                <div className="hidden lg:flex items-center gap-10 font-black text-[13px] uppercase tracking-widest text-slate-500">
                                    <button onClick={() => setAppState(AppState.INPUT)} className={`transition-colors hover:text-indigo-600 ${appState === AppState.INPUT ? 'text-indigo-600' : ''}`}>Create</button>
                                    <button onClick={() => setAppState(AppState.LIBRARY)} className={`transition-colors hover:text-indigo-600 ${appState === AppState.LIBRARY ? 'text-indigo-600' : ''}`}>Library</button>
                                    <button onClick={() => setAppState(AppState.MAGIC_STUDIO)} className={`transition-colors hover:text-indigo-600 ${appState === AppState.MAGIC_STUDIO ? 'text-indigo-600' : ''}`}>Magic Studio</button>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="hidden lg:flex items-center gap-8">
                                    <button onClick={logout} className="font-black text-[13px] uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Sign Out</button>
                                </div>

                                <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
                                    <button onClick={() => setAppState(AppState.CART)} className="relative p-2 text-slate-400 hover:text-indigo-600 mr-2">
                                        <ShoppingCartIcon className="w-6 h-6" />
                                        {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
                                    </button>

                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">
                                        {user.email?.[0]?.toUpperCase()}
                                    </button>
                                    {isDropdownOpen && <AccountDropdown
                                        user={user} onLogout={logout} onDeleteAccount={deleteAccount} onClose={() => setIsDropdownOpen(false)}
                                        onLibrary={() => setAppState(AppState.LIBRARY)} onCreate={() => setAppState(AppState.INPUT)} onStudio={() => setAppState(AppState.MAGIC_STUDIO)}
                                    />}
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* MOBILE MENU - Simplified */}
                    <div
                        className={`fixed inset-0 z-[100] transition-all duration-500 ease-in-out lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                        style={{ backgroundColor: '#0f172a' }}
                    >
                        <div className={`flex flex-col items-center justify-center h-full gap-8 px-6 text-center transform transition-all duration-500 ${isMobileMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-10 scale-95 opacity-0'}`}>
                            <div className="flex flex-col gap-6 w-full">
                                <button onClick={() => { setAppState(AppState.INPUT); setIsMobileMenuOpen(false); }} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${appState === AppState.INPUT ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>Create</button>
                                <button onClick={() => { setAppState(AppState.LIBRARY); setIsMobileMenuOpen(false); }} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${appState === AppState.LIBRARY ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>Library</button>
                                <button onClick={() => { setAppState(AppState.MAGIC_STUDIO); setIsMobileMenuOpen(false); }} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${appState === AppState.MAGIC_STUDIO ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>Magic Studio</button>
                            </div>

                            <div className="w-24 h-1 bg-white/10 rounded-full my-6" />

                            <div className="flex flex-col gap-5 w-full max-w-xs">
                                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-white/60 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">Sign Out</button>
                            </div>
                        </div>
                    </div>

                    <main className="max-w-7xl mx-auto px-6 py-32">
                        {appState === AppState.INPUT && <StoryInputForm onSubmit={handleInputSubmit} onAddToCart={(input) => { addToCart(input).then(() => setAppState(AppState.CART)) }} onBack={() => setAppState(AppState.LIBRARY)} isSampleDisabled={isSampleDisabled} />}
                        {appState === AppState.PRICING && <PricingPage onBuyNow={() => setAppState(AppState.INPUT)} onStartCreating={() => setAppState(AppState.INPUT)} />}
                        {appState === AppState.CART && <CartPage items={cart} onRemoveItem={removeFromCart} onUpdateItemType={updateItemType} onCheckout={() => setShowPaymentModal(true)} onBack={() => setAppState(AppState.INPUT)} />}
                        {appState === AppState.LIBRARY && <LibraryPage stories={stories} isLoading={isInitialLoading} hasMore={hasMore} onLoadMore={loadMore} onOpenStory={(story) => { hydrateStory(story.id).then(() => { setAppState(AppState.PREVIEW); }); }} onDeleteStory={deleteStory} onShareStory={setShowShareModal} onRegenerate={regenerateStory} onCreateNew={() => setAppState(AppState.INPUT)} onBack={() => setAppState(AppState.INPUT)} />}
                        {appState === AppState.MAGIC_STUDIO && <MagicStudioPage stories={stories} isLoading={isInitialLoading} initialBookId={activeStory?.id || null} onOpenColoring={handleOpenColoring} onDownloadBook={(s) => generateHomePrintPDF(s, { childName: s.childName } as any)} onCreateNew={() => setAppState(AppState.INPUT)} onBack={() => setAppState(AppState.INPUT)} />}

                        {/* Generation View */}
                        {/* Generation View - Show Preview if we have pages, otherwise show spinner */}
                        {(appState === AppState.GENERATING_STORY || isGenerating) && (
                            activeStory?.pages && activeStory.pages.length > 0 ? (
                                <div className="relative">
                                    {/* Overlay for "Still Weaving" */}
                                    <div className="fixed top-24 right-6 z-40 bg-white/90 backdrop-blur border border-indigo-100 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in">
                                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        <div>
                                            <p className="font-bold text-sm text-indigo-900">{generationProgress?.currentStep || "Weaving Story..."}</p>
                                            <p className="text-xs text-indigo-500 font-bold">{generationProgress?.progress}% Complete</p>
                                        </div>
                                    </div>

                                    {/* Show the Studio (Live Preview) */}
                                    <MagicStudioPage
                                        stories={stories}
                                        isLoading={false}
                                        initialBookId={activeStory?.id || null}
                                        onOpenColoring={handleOpenColoring}
                                        onDownloadBook={(s) => generateHomePrintPDF(s, { childName: s.childName } as any)}
                                        onCreateNew={() => setAppState(AppState.INPUT)}
                                        onBack={() => setAppState(AppState.INPUT)}
                                    />
                                </div>
                            ) : (
                                <div className="max-w-6xl mx-auto py-10 space-y-12 animate-fade-in text-center">
                                    <div className="relative w-32 h-32 mx-auto">
                                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-[2.5rem] border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center"><SparklesIcon className="w-12 h-12 text-indigo-600 animate-bounce" /></div>
                                    </div>
                                    <h2 className="text-4xl font-black">{generationProgress?.currentStep || "Making Magic..."}</h2>
                                    <p className="text-slate-400 font-bold">{generationProgress?.progress}% Complete</p>
                                </div>
                            )
                        )}

                        {appState === AppState.PREVIEW && <MagicStudioPage stories={stories} isLoading={isInitialLoading} initialBookId={activeStory?.id || null} onOpenColoring={handleOpenColoring} onDownloadBook={(s) => generateHomePrintPDF(s, { childName: s.childName } as any)} onCreateNew={() => setAppState(AppState.INPUT)} onBack={() => setAppState(AppState.INPUT)} />}
                    </main>

                    {/* MODALS */}
                    {showPaymentModal && <PaymentModal
                        userProfile={user}
                        storyId={checkoutStoryId || undefined}
                        storyTitle={activeStory?.title || pendingInput?.childName ? `${pendingInput?.childName}'s Adventure` : 'New Story'}
                        cartItems={cart}
                        cartTotal={cart.reduce((sum, item) => sum + item.price, 0)}
                        onSuccess={handlePaymentSuccess}
                        onClose={() => { setShowPaymentModal(false); setCheckoutStoryId(null); }}
                        onSubscribeClick={() => setAppState(AppState.PRICING)}
                    />}

                    {showShareModal && <ShareModal story={showShareModal} onClose={() => setShowShareModal(null)} />}

                    {activeColoringPage !== null && activeStory && (
                        <div className="fixed inset-0 z-[100]">
                            <ColoringInterface
                                imageUrl={activeStory.pages[activeColoringPage].imageUrl || ''}
                                initialState={activeStory.pages[activeColoringPage].coloredImageUrl}
                                onSave={(data) => { saveColoringPage(activeStory.id, activeColoringPage, data); setActiveColoringPage(null); }}
                                onClose={() => setActiveColoringPage(null)}
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
