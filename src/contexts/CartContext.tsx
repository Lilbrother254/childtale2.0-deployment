
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, UserInput } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from './AuthContext';

interface CartContextType {
    cart: CartItem[];
    addToCart: (input: UserInput) => Promise<void>;
    removeFromCart: (id: string) => void;
    updateItemType: (id: string, type: 'DIGITAL' | 'HARDCOVER') => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('childtale_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse cart", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('childtale_cart', JSON.stringify(cart));
    }, [cart]);

    // Universal Cart Sync: Hydrate from DB on login
    useEffect(() => {
        if (!user) return;

        const syncCart = async () => {
            try {
                console.log("🏦 Syncing Universal Cart from DB...");
                const dbCartItems = await supabaseService.getUserCart(user.id);

                const syncedCart: CartItem[] = dbCartItems.map(story => ({
                    id: story.id,
                    bookId: story.id,
                    title: story.title,
                    type: 'DIGITAL',
                    price: 24.99,
                    inputDetails: {
                        category: story.category,
                        childName: story.childName,
                        childAge: story.childAge,
                        childGender: story.childGender,
                        characterDescription: story.characterDescription || '',
                        prompt: story.originalPrompt || '',
                        pageCount: story.pageCount
                    }
                }));

                setCart(syncedCart);
                localStorage.setItem('childtale_cart', JSON.stringify(syncedCart));
                console.log(`✅ Universal Cart synced: ${syncedCart.length} items`);
            } catch (err) {
                console.error("❌ Universal Cart Sync Failed:", err);
            }
        };

        syncCart();
    }, [user?.id]);

    // Cleanup Logic: Ensure purchased items don't linger
    useEffect(() => {
        if (!user || cart.length === 0) return;

        const validate = async () => {
            // FIX: Only validate items that HAVE a real database ID. 
            // Ignore TEMP_ items as they are currently syncing in the background.
            const syncableItems = cart.filter(item => !item.bookId.startsWith('TEMP_'));
            if (syncableItems.length === 0) return;

            const bookIds = syncableItems.map(item => item.bookId);
            const validDbIds = await supabaseService.validateCartBooks(bookIds);

            // A cart item is valid if:
            // 1. It's an optimistic TEMP_ item (not yet synced)
            // 2. OR its DB ID is still valid (not deleted/purchased)
            const validCart = cart.filter(item =>
                item.bookId.startsWith('TEMP_') || validDbIds.includes(item.bookId)
            );

            if (validCart.length !== cart.length) {
                console.log("🛒 Auto-clearing purchased or invalid items from cart...");
                setCart(validCart);
            }
        };
        // Run validation with a delay to give background syncs time to complete 
        const timer = setTimeout(validate, 3000);
        return () => clearTimeout(timer);
    }, [user, cart.length]);

    const isProcessing = React.useRef(false);

    const addToCart = async (input: UserInput) => {
        if (isProcessing.current) {
            console.warn("⚠️ addToCart already in progress, skipping...");
            return;
        }

        console.log("🛒 addToCart (Optimistic) triggered:", { input, userId: user?.id });
        if (!user) {
            console.error("❌ No user found in addToCart");
            return;
        }

        // 1. Create a temporary ID and add to state immediately
        const tempId = `TEMP_${crypto.randomUUID()}`;
        const newCartItem: CartItem = {
            id: tempId,
            bookId: tempId, // Temporary pointer
            title: `${input.childName}'s Adventure`,
            type: 'DIGITAL',
            price: 24.99,
            inputDetails: input
        };

        setCart(prev => [...prev, newCartItem]);
        console.log("⚡ Optimistic UI update: Item added to local state.");

        // 2. Perform DB sync in background
        try {
            isProcessing.current = true;
            console.log("⏳ Syncing book draft to database...");
            const bookId = await supabaseService.createBook(user.id, input, `${input.childName}'s Adventure`, 'draft');
            console.log("✅ DB Sync Complete. Book ID:", bookId);

            // 3. Swap the temporary ID with the real database ID
            setCart(prev => prev.map(item =>
                item.id === tempId
                    ? { ...item, id: bookId, bookId: bookId }
                    : item
            ));
        } catch (err) {
            console.error("❌ DB Sync Failed for Cart Item:", err);
            // Optional: Rollback if needed, but since it's in localStorage too, we might leave it or notify user.
            // For now, let's keep it in the cart but it won't be "synced" cross-device until retry.
        } finally {
            isProcessing.current = false;
        }
    };

    const removeFromCart = async (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
        if (user) {
            try {
                // Use bookId for deletion if it's a synced item
                const item = cart.find(i => i.id === id);
                if (item) {
                    await supabaseService.deleteBook(item.bookId);
                    console.log("🗑️ Cart item deleted from database");
                }
            } catch (err) {
                console.error("Failed to delete cart item from database:", err);
            }
        }
    };

    const updateItemType = (id: string, type: 'DIGITAL' | 'HARDCOVER') => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    type,
                    price: type === 'HARDCOVER' ? 49.99 : 24.99
                };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('childtale_cart');
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateItemType, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};
