import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { supabaseService } from '../../services/supabaseService';
import { UserProfile } from '../../types';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            try {
                // If we already have a user, don't set loading to true again
                const profile = await supabaseService.getProfile(session.user.id);
                if (profile) {
                    setUser(profile);
                }
            } catch (err) {
                console.error("❌ Profile refresh error:", err);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        // 1. Initial Session Check (Standard Supabase)
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (isMounted && session?.user) {
                // Instantly set a "Shell User" so the UI transitions
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    samplesUsed: 0,
                    storeCreditBalance: 0,
                    isAdmin: false,
                    lastSampleAt: undefined
                });
                // CRITICAL: Resolve loading screen immediately once we have a user
                setIsLoading(false);
                // Then hydrate the real profile in background
                refreshProfile();
            } else {
                setIsLoading(false);
            }
        });

        // 2. Auth State Change Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log("🔔 Auth Event:", _event, session?.user?.id || 'No User');

            if (session?.user) {
                // 3. Instant UI transition for login/session recovery
                if (!user || user.id !== session.user.id) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        samplesUsed: 0,
                        storeCreditBalance: 0,
                        isAdmin: false,
                        lastSampleAt: undefined
                    });
                }

                // 4. Background Profile Hydration (with built-in retry logic)
                try {
                    const profile = await supabaseService.getProfile(session.user.id);

                    if (isMounted) {
                        if (profile) {
                            console.log("✅ Profile hydrated successfully");
                            setUser(profile);
                        } else {
                            console.warn("⚠️ Profile fetch failed after retries - keeping shell user (app remains functional)");
                            // Keep the shell user we set above - app remains functional
                        }
                    }
                } catch (err) {
                    // This should rarely happen now since getProfile returns null instead of throwing
                    console.error("❌ Unexpected Profile Hydration Error:", err);
                    if (isMounted) {
                        console.warn("⚠️ Keeping shell user despite error");
                    }
                } finally {
                    // CRITICAL: Always set loading to false, regardless of success/failure
                    if (isMounted) {
                        setIsLoading(false);
                        console.log("🏁 Auth loading complete");
                    }
                }
            } else {
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        // Optimistic UI: Update state immediately before network call
        setUser(null);
        setIsLoading(false);
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        await supabaseService.deleteAccount(user.id);
        await logout();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAdmin: !!user?.isAdmin, logout, deleteAccount, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
