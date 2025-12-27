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

    const hydratedUserId = React.useRef<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        // 1. Initial Session Check (Standard Supabase)
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (isMounted) {
                if (session?.user) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        samplesUsed: 0,
                        storeCreditBalance: 0,
                        isAdmin: false,
                        lastSampleAt: undefined
                    });
                    setIsLoading(false);
                    refreshProfile();
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
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

                // 4. SMART HYDRATION: Don't hammer the server if we just did this
                if (hydratedUserId.current === session.user.id && user?.samplesUsed !== undefined) {
                    console.log("🤫 Skipping hydration - already have full profile");
                    return;
                }

                // 5. Background Profile Hydration (with built-in cache/dedup)
                try {
                    const profile = await supabaseService.getProfile(session.user.id);

                    if (isMounted) {
                        if (profile) {
                            console.log("✅ Profile hydrated successfully");
                            setUser(profile);
                            hydratedUserId.current = session.user.id;
                        } else {
                            console.warn("⚠️ Profile fetch failed/timed out - keeping shell");
                        }
                    }
                } catch (err) {
                    console.error("❌ Unexpected Profile Hydration Error:", err);
                } finally {
                    if (isMounted) {
                        setIsLoading(false);
                        console.log("🏁 Auth loading complete");
                    }
                }
            } else {
                if (isMounted) {
                    setUser(null);
                    hydratedUserId.current = null;
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
        console.log("🚪 Logging out...");
        // Optimistic UI
        setUser(null);
        setIsLoading(false);
        try {
            // 1. Sign out from all sessions globally
            await supabase.auth.signOut({ scope: 'global' });

            // 2. Force clear any residual supabase keys in ALL storage
            [localStorage, sessionStorage].forEach(storage => {
                Object.keys(storage).forEach(key => {
                    if (key.includes('supabase.auth.token') || key.includes('sb-')) {
                        storage.removeItem(key);
                    }
                });
            });

            // 3. Force a full location replace to clear session history
            window.location.replace('/');
        } catch (err) {
            console.error("Logout error:", err);
            window.location.replace('/');
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        await supabaseService.deleteAccount(user.id);
        await logout();
    };

    const authValue = React.useMemo(() => ({
        user,
        isLoading,
        isAdmin: !!user?.isAdmin,
        logout,
        deleteAccount,
        refreshProfile
    }), [user, isLoading]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
