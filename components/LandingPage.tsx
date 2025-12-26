
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

        // Cookie consent check with 2s delay
        const consent = localStorage.getItem('childtale-cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setShowCookieBanner(true), 2000);
            return () => {
                window.removeEventListener('scroll', handleScroll);
                clearTimeout(timer);
            };
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
        <div className="min-h-screen font-['Nunito'] text-slate-900 magical-mesh selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-700">
            {/* 🏰 THE PALACE NAV: Floating Pill Style */}
            <div className="fixed top-6 left-0 w-full z-[1000] px-4 pointer-events-none">
                <nav className={`max-w-4xl mx-auto glass-pill rounded-full px-6 py-2 transition-all duration-500 pointer-events-auto flex items-center justify-between ${scrollY > 100 ? 'py-1.5 px-5' : ''}`}>
                    <div onClick={() => handleNavClick('HOME')} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <ChildTaleLogo size="xs" dark={true} />
                    </div>

                    {/* Minimalist Desktop Links */}
                    <div className="hidden lg:flex items-center gap-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        <button onClick={() => handleNavClick('ABOUT')} className={`hover:text-indigo-600 transition-colors ${currentView === 'ABOUT' ? 'text-indigo-600' : ''}`}>About</button>
                        <button onClick={() => handleNavClick('HOW_IT_WORKS')} className={`hover:text-indigo-600 transition-colors ${currentView === 'HOW_IT_WORKS' ? 'text-indigo-600' : ''}`}>Guide</button>
                        <button onClick={() => handleNavClick('PRICING')} className={`hover:text-indigo-600 transition-colors ${currentView === 'PRICING' ? 'text-indigo-600' : ''}`}>Pricing</button>
                    </div>

                    <div className="flex items-center gap-3">
                        {!user && (
                            <button onClick={handleStartClick} className="hidden md:block font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 px-4">Login</button>
                        )}
                        <button
                            onClick={user ? () => onLogin('reload') : handleStartClick}
                            className={`bg-slate-900 text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.25em] shadow-lg shadow-slate-200/50 hover:bg-slate-800 transition-all active:scale-95 ${scrollY > 100 ? 'px-4 py-2' : ''}`}
                        >
                            {user ? 'Studio' : 'Start'}
                        </button>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-slate-900"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Menu Overlay: Glass Style */}
            <div
                className={`fixed inset-0 z-[1100] transition-all duration-700 ease-in-out lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
            >
                <div className={`flex flex-col items-center justify-center h-full gap-8 px-6 text-center transform transition-all duration-700 ${isMobileMenuOpen ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95 opacity-0'}`}>
                    <div className="flex flex-col gap-8 w-full">
                        <button onClick={() => handleNavClick('HOME')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'HOME' ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}>Home</button>
                        <button onClick={() => handleNavClick('ABOUT')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'ABOUT' ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}>About</button>
                        <button onClick={() => handleNavClick('PRICING')} className={`text-4xl font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'PRICING' ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}>Pricing</button>
                    </div>

                    <div className="w-24 h-1 bg-white/5 rounded-full my-6" />

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button
                            onClick={user ? () => onLogin('reload') : handleStartClick}
                            className="bg-indigo-600 text-white w-full py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            {user ? 'My Studio' : 'Start Creating'}
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/30 font-black text-[10px] uppercase tracking-widest mt-4">Close Menu</button>
                    </div>
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

            {/* 🏰 THE PALACE FOOTER */}
            <footer className="py-24 px-6 bg-[#0f172a] text-white/40 mt-20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start gap-8">
                        <ChildTaleLogo size="xs" dark={false} />
                        <p className="max-w-xs text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 leading-relaxed">
                            Elevating childhood memories through handcrafted AI magic.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center font-black text-[13px] uppercase tracking-[0.2em] text-white/50">
                        <button onClick={() => handleNavClick('PRIVACY')} className="hover:text-white transition-colors">Privacy Policy</button>
                        <button onClick={() => handleNavClick('TERMS')} className="hover:text-white transition-colors">Terms of Service</button>
                        <button onClick={() => handleNavClick('COOKIES')} className="hover:text-white transition-colors">Cookie Policy</button>
                        <a href="mailto:childtale4@gmail.com" className="hover:text-white transition-colors">Support</a>
                    </div>
                    <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.3em] md:ml-auto">© {new Date().getFullYear()} ChildTale</p>
                </div>
            </footer>

            {/* Cookie Consent Snackbar (Delayed & Slim) */}
            {showCookieBanner && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[200] animate-fade-in-up">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl p-4 flex items-center gap-4">
                        <div className="flex-grow">
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                                Experience enhanced magic with our <button onClick={() => handleNavClick('COOKIES')} className="text-indigo-600 underline">cookies</button>.
                            </p>
                        </div>
                        <button
                            onClick={acceptCookies}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex-shrink-0"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {/* AUTH MODAL */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in p-4">
                    <div className="auth-modal-card relative">
                        <div className="flex items-center justify-center mb-10 relative">
                            <ChildTaleLogo size="sm" dark={true} />
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-50 z-[210]"
                                aria-label="Close authentication modal"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

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
