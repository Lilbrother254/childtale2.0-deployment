
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

    // Validate cart on load
    useEffect(() => {
        if (!user || cart.length === 0) return;
        const validate = async () => {
            const bookIds = cart.map(item => item.bookId);
            const validItems = await supabaseService.validateCartBooks(bookIds);

            // validItems now only contains IDs of books that:
            // 1. Exist
            // 2. Are NOT already purchased (backend should filter them out)
            const validCart = cart.filter(item => validItems.includes(item.bookId));

            if (validCart.length !== cart.length) {
                console.log("🛒 Auto-clearing purchased or invalid items from cart...");
                setCart(validCart);
                localStorage.setItem('childtale_cart', JSON.stringify(validCart));
            }
        };
        // Run validation with a small delay to allow DB updates to propagate on slow connections
        const timer = setTimeout(validate, 2000);
        return () => clearTimeout(timer);
    }, [user, cart.length]); // Re-run when cart size changes or user changes

    const addToCart = async (input: UserInput) => {
        console.log("🛒 addToCart triggered:", { input, userId: user?.id });
        if (!user) {
            console.error("❌ No user found in addToCart");
            return;
        }
        try {
            console.log("⏳ Pre-creating book draft for cart...");
            const bookId = await supabaseService.createBook(user.id, input, `${input.childName}'s Adventure`, 'draft');
            console.log("✅ Cart book created with ID:", bookId);
            const newCartItem: CartItem = {
                id: crypto.randomUUID(),
                bookId: bookId,
                title: `${input.childName}'s Adventure`,
                type: 'DIGITAL',
                price: 24.99,
                inputDetails: input
            };
            setCart(prev => [...prev, newCartItem]);
            console.log("✅ Added to local cart state");
        } catch (err) {
            console.error("❌ Cart Add Error:", err);
            throw err;
        }
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
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
