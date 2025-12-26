
import React, { useState, useEffect } from 'react';
import { XIcon, GoogleIcon, MailIcon, SparklesIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, CheckIcon, MenuIcon } from './Icons';
import { supabase } from '../utils/supabaseClient';
import { PricingPage } from './PricingPage';
import { ChildTaleLogo } from './Branding';
import { HomePage } from './HomePage';
import { AboutPage } from './AboutPage';
import { HowItWorksPage } from './HowItWorksPage';
import { PrivacyPolicy, TermsOfService, CookiePolicy } from './Policies';
import { FAQPage } from './FAQPage';

import { UserProfile } from '../types';

interface LandingPageProps {
    onLogin: (email: string) => void;
    user: UserProfile | null;
    onLogout: () => Promise<void>;
}

type AuthView = 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'SENT';
type ViewState = 'HOME' | 'ABOUT' | 'HOW_IT_WORKS' | 'PRICING' | 'FAQ' | 'PRIVACY' | 'TERMS' | 'COOKIES';

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, user, onLogout }) => {
    const [currentView, setCurrentView] = useState<ViewState>('HOME');
    const [scrollY, setScrollY] = useState(0);
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authView, setAuthView] = useState<AuthView>('LOGIN');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
        };
        checkSession();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);

        // Cookie consent check
        const consent = localStorage.getItem('childtale-cookie-consent');
        if (!consent) {
            setShowCookieBanner(true);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (view: ViewState) => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStartClick = () => {
        setShowAuthModal(true);
        setAuthStatus('idle');
        setAuthError('');
        setAuthView('LOGIN');
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (authStatus === 'loading') return;

        setAuthStatus('loading');
        setAuthError('');

        const authTimeout = setTimeout(() => {
            setAuthStatus(current => {
                if (current === ('loading' as string)) {
                    console.warn("⚠️ Auth Login: Safety timeout reached. Forcing idle.");
                    setAuthError("Authentication is taking longer than usual. Please check your connection or try again.");
                    return 'idle' as any;
                }
                return current;
            });
        }, 5000);

        try {
            if (authView === 'SIGNUP') {
                const { error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: { data: { email: email.trim() } }
                });
                if (error) throw error;
                setShowAuthModal(false);
                onLogin(email.trim());
            } else {
                console.log("🔑 Attempting password login for:", email);
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                });
                if (error) {
                    if (error.message.toLowerCase().includes('invalid login credentials')) {
                        setAuthError("No account found with these credentials. Maybe you should sign up instead?");
                    } else {
                        throw error;
                    }
                } else {
                    // SUCCESS! Close modal immediately
                    console.log("✅ Auth login success for:", email);
                    setShowAuthModal(false);
                    onLogin(email.trim());
                }
            }
        } catch (error: any) {
            console.error("❌ Auth submit error:", error);
            setAuthError(error.message || 'Authentication failed.');
            setAuthStatus('idle');
        } finally {
            clearTimeout(authTimeout);
            console.log("🏁 Auth submit finished. Resetting to idle.");
            setAuthStatus(prev => authView === 'SENT' ? prev : 'idle');
        }
    };

    const handleMagicLink = async () => {
        if (!email.trim()) {
            setAuthError("Enter your email for a magic link.");
            return;
        }
        setAuthStatus('loading');
        setAuthError('');
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    emailRedirectTo: window.location.origin,
                }
            });
            if (error) throw error;
            setAuthView('SENT');
        } catch (error: any) {
            setAuthError(error.message);
        } finally {
            if (authView !== 'SENT') setAuthStatus('idle');
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setAuthError("Enter your email to reset password.");
            return;
        }
        setAuthStatus('loading');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) throw error;
            setAuthView('SENT');
        } catch (error: any) {
            setAuthError(error.message);
        } finally {
            if (authView !== 'SENT') setAuthStatus('idle');
        }
    };

    const handleLogout = async () => {
        try {
            console.log("🚪 Attempting magic logout...");
            await onLogout();
            console.log("✅ Logout successful");
            onLogin(''); // Instantly notify parent
        } catch (error) {
            console.error("❌ Logout error:", error);
            onLogin(''); // Fallback
        }
    };

    const acceptCookies = () => {
        localStorage.setItem('childtale-cookie-consent', 'true');
        setShowCookieBanner(false);
    };

    return (
        <div className="min-h-screen font-['Nunito'] text-slate-900 bg-slate-50">
            {/* Top Navigation */}
            <nav className={`fixed top-0 left-0 w-full transition-all duration-300 z-[120] ${isMobileMenuOpen ? 'bg-transparent' : (scrollY > 50 ? 'bg-white/98 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5')}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div onClick={() => handleNavClick('HOME')} className="cursor-pointer relative z-[110]">
                        <ChildTaleLogo dark={!isMobileMenuOpen} size="sm" />
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-10 font-black text-[13px] uppercase tracking-widest text-slate-500">
                        <button onClick={() => handleNavClick('HOME')} className={`transition-colors hover:text-indigo-600 ${currentView === 'HOME' ? 'text-indigo-600' : ''}`}>Home</button>
                        <button onClick={() => handleNavClick('ABOUT')} className={`transition-colors hover:text-indigo-600 ${currentView === 'ABOUT' ? 'text-indigo-600' : ''}`}>About</button>
                        <button onClick={() => handleNavClick('HOW_IT_WORKS')} className={`transition-colors hover:text-indigo-600 ${currentView === 'HOW_IT_WORKS' ? 'text-indigo-600' : ''}`}>Guide</button>
                        <button onClick={() => handleNavClick('PRICING')} className={`transition-colors hover:text-indigo-600 ${currentView === 'PRICING' ? 'text-indigo-600' : ''}`}>Pricing</button>
                        <button onClick={() => handleNavClick('FAQ')} className={`transition-colors hover:text-indigo-600 ${currentView === 'FAQ' ? 'text-indigo-600' : ''}`}>FAQ</button>
                    </div>

                    <div className="flex items-center gap-10 relative z-[60]">
                        <div className="hidden lg:flex items-center gap-10">
                            {user ? (
                                <button onClick={handleLogout} className="font-black text-[13px] uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Sign Out</button>
                            ) : (
                                <button onClick={handleStartClick} className="font-black text-[13px] uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Sign In / Sign Up</button>
                            )}
                            <button
                                onClick={user ? () => onLogin('reload') : handleStartClick}
                                className="bg-[#FF721F] text-white px-8 py-4 rounded-full font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-orange-200/50 hover:bg-[#FF853A] transition-all transform hover:-translate-y-0.5 active:scale-95"
                            >
                                Start Coloring Now
                            </button>
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`lg:hidden focus:outline-none transition-all relative z-[110] ${isMobileMenuOpen ? 'text-white' : 'text-slate-900 shadow-none'}`}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <XIcon className="w-8 h-8" /> : <MenuIcon className="w-8 h-8" />}
                        </button>
                    </div>
                </div>

            </nav>

            {/* Mobile Menu Overlay - Moved outside nav for higher Z-stacking context */}
            <div
                className={`fixed inset-0 z-[100] transition-all duration-500 ease-in-out lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{ backgroundColor: '#0f172a' }}
            >
                <div className={`flex flex-col items-center justify-center h-full gap-8 px-6 text-center transform transition-all duration-500 ${isMobileMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-10 scale-95 opacity-0'}`}>
                    <div className="flex flex-col gap-6 w-full">
                        <button onClick={() => handleNavClick('HOME')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'HOME' ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>Home</button>
                        <button onClick={() => handleNavClick('ABOUT')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'ABOUT' ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>About</button>
                        <button onClick={() => handleNavClick('HOW_IT_WORKS')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'HOW_IT_WORKS' ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>Guide</button>
                        <button onClick={() => handleNavClick('PRICING')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'PRICING' ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>Pricing</button>
                        <button onClick={() => handleNavClick('FAQ')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'FAQ' ? 'text-orange-400' : 'text-white hover:text-orange-300'}`}>FAQ</button>
                    </div>

                    <div className="w-24 h-1 bg-white/10 rounded-full my-6" />

                    {user ? (
                        <div className="flex flex-col gap-5 w-full max-w-xs">
                            <button onClick={() => onLogin('reload')} className="bg-[#FF721F] text-white w-full py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-500/40 active:scale-95 transition-all">My Studio</button>
                            <button onClick={handleLogout} className="text-white/60 font-black text-xs uppercase tracking-widest">Sign Out</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 w-full max-w-xs">
                            <button onClick={() => { handleStartClick(); setIsMobileMenuOpen(false); }} className="bg-[#FF721F] text-white w-full py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-500/40 active:scale-95 transition-all">Start Coloring Now</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Sections */}
            <main>
                {currentView === 'HOME' && <HomePage onStartCreating={handleStartClick} />}
                {currentView === 'ABOUT' && <AboutPage />}
                {currentView === 'HOW_IT_WORKS' && <HowItWorksPage />}
                {currentView === 'PRICING' && (
                    <div className="pt-24 bg-slate-50 min-h-screen">
                        <PricingPage mode="display" onStartCreating={handleStartClick} />
                    </div>
                )}
                {currentView === 'FAQ' && <FAQPage onBack={() => handleNavClick('HOME')} />}
                {currentView === 'PRIVACY' && <PrivacyPolicy onBack={() => handleNavClick('HOME')} />}
                {currentView === 'TERMS' && <TermsOfService onBack={() => handleNavClick('HOME')} />}
                {currentView === 'COOKIES' && <CookiePolicy onBack={() => handleNavClick('HOME')} />}
            </main>

            {/* Footer */}
            <footer className="py-16 px-6 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col items-center md:items-start gap-6">
                        <ChildTaleLogo size="sm" dark={false} />
                        <p className="text-white/40 text-sm font-bold max-w-xs text-center md:text-left leading-relaxed">Making core memories and sparks of imagination, one page at a time.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center font-black text-[13px] uppercase tracking-[0.2em] text-white/50">
                        <button onClick={() => handleNavClick('PRIVACY')} className="hover:text-white transition-colors">Privacy Policy</button>
                        <button onClick={() => handleNavClick('TERMS')} className="hover:text-white transition-colors">Terms of Service</button>
                        <button onClick={() => handleNavClick('COOKIES')} className="hover:text-white transition-colors">Cookie Policy</button>
                        <a href="mailto:childtale4@gmail.com" className="hover:text-white transition-colors">Support</a>
                    </div>
                    <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.3em]">© {new Date().getFullYear()} ChildTale</p>
                </div>
            </footer>

            {/* Cookie Consent Banner */}
            {showCookieBanner && (
                <div className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 z-[110] bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-fade-in">
                    <div className="flex items-start gap-4">
                        <div className="bg-indigo-50 p-2 rounded-xl">
                            <SparklesIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-black text-slate-900 text-lg">Cookies & Privacy</h4>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                We use cookies to ensure you get the best experience on ChildTale, compliant with GDPR and CCPA.
                                <button onClick={() => handleNavClick('COOKIES')} className="text-indigo-600 hover:underline ml-1">Learn more</button>.
                            </p>
                            <button
                                onClick={acceptCookies}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUTH MODAL */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in p-4">
                    <div className="auth-modal-card relative">
                        <div className="flex justify-center mb-8">
                            <ChildTaleLogo size="sm" dark={true} />
                        </div>
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 p-3.5 text-slate-500 hover:text-slate-900 transition-colors rounded-full bg-slate-100 hover:bg-slate-200 z-[210] shadow-sm md:shadow-none"
                            aria-label="Close authentication modal"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>

                        {authView === 'SENT' ? (
                            <div className="text-center py-6">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MailIcon className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Check your email</h2>
                                <p className="text-slate-500 font-bold mb-8">We've sent a magic link to <span className="text-slate-900">{email}</span></p>
                                <button onClick={() => setAuthView('LOGIN')} className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto justify-center">
                                    <ArrowLeftIcon className="w-4 h-4" /> Back to Login
                                </button>
                            </div>
                        ) : authView === 'FORGOT' ? (
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Reset Password</h2>
                                <p className="text-slate-500 font-bold mb-8 text-center text-sm">Enter your email and we'll send a reset link.</p>
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="auth-input-group">
                                        <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">Email</label>
                                        <div className="auth-input-wrapper">
                                            <input className="auth-input-field" type="email" placeholder="email@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                                            <MailIcon className="auth-input-icon w-5 h-5" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={authStatus === 'loading'} className="btn-auth-primary">
                                        {authStatus === 'loading' ? 'Processing...' : 'Send Reset Link'}
                                    </button>
                                    <button type="button" onClick={() => setAuthView('LOGIN')} className="w-full text-slate-500 font-bold text-sm mt-4 hover:text-indigo-600 transition-colors">
                                        Back to Login
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div>
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-black text-slate-900 mb-2">{authView === 'LOGIN' ? 'Welcome back' : 'Create Account'}</h2>
                                    <p className="text-slate-500 font-bold text-sm">{authView === 'LOGIN' ? 'Sign in using your password' : 'Start your magical journey today'}</p>
                                </div>

                                <form onSubmit={handleAuthSubmit} className="space-y-5">
                                    <div className="auth-input-group">
                                        <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-widest">Email</label>
                                        <div className="auth-input-wrapper">
                                            <input
                                                className="auth-input-field"
                                                type="email"
                                                placeholder="email@example.com"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                            <MailIcon className="auth-input-icon w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="auth-input-group">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Password</label>
                                            {authView === 'LOGIN' && (
                                                <button type="button" onClick={() => setAuthView('FORGOT')} className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Forgot password?</button>
                                            )}
                                        </div>
                                        <div className="auth-input-wrapper">
                                            <input
                                                className="auth-input-field"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="auth-input-icon hover:text-slate-900 transition-colors"
                                            >
                                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {authError && (
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-2">
                                            <p className="text-red-500 text-[11px] text-center font-bold">
                                                {authError}
                                                {authError.includes('sign up instead') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setAuthView('SIGNUP'); setAuthError(''); }}
                                                        className="block mx-auto mt-1 text-indigo-600 underline"
                                                    >
                                                        Switch to Sign Up
                                                    </button>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    <button type="submit" disabled={authStatus === 'loading'} className="btn-auth-primary shadow-xl shadow-slate-200">
                                        {authStatus === 'loading' ? 'Processing...' : (authView === 'LOGIN' ? 'Sign in' : 'Create Account')}
                                    </button>

                                    <button type="button" onClick={handleMagicLink} className="w-full text-[11px] font-black text-indigo-600 uppercase tracking-widest py-2 hover:underline">
                                        Or sign in with Magic Link
                                    </button>
                                </form>

                                <div className="divider-text">OR CONTINUE WITH</div>

                                <button type="button" className="btn-auth-social mb-10">
                                    <GoogleIcon className="w-6 h-6" /> Google
                                </button>

                                <p className="text-center text-sm font-bold text-slate-500">
                                    {authView === 'LOGIN' ? "No account?" : "Already have an account?"}{' '}
                                    <button
                                        onClick={() => setAuthView(authView === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                                        className="text-slate-900 font-black hover:underline"
                                    >
                                        {authView === 'LOGIN' ? "Create one" : "Sign in"}
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
