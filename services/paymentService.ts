
import { supabase } from "../utils/supabaseClient";
import { CartItem } from "../types";
import { luluService } from "./luluService";
import { getLuluCoverBlob, getLuluInteriorBlob, getLuluVectorCoverBlob, getLuluVectorInteriorBlob } from "../utils/pdfGenerator";
import { UserInput } from "../types";

export const PRICING = {
    DIGITAL_SINGLE: 24.99,
    HARDCOVER: 49.99, // Includes free US standard shipping (Currently withhold)
    HEROES_DISCOUNT_PERCENT: 25,
    WELCOME_DISCOUNT_PERCENT: 20,
    REFERRAL_REWARD_PERCENT: 10,
    BULK_DISCOUNT_PERCENT: 15,
    SHIPPING_FLAT_RATE: 0,
};

export type ShippingLevel = 'MAIL' | 'PRIORITY_MAIL' | 'GROUND_HD' | 'EXPEDITED';

export interface ShippingDetails {
    name: string;
    address: string;
    city: string;
    state: string; // Required for US/CA etc
    zip: string;
    country: string;
    phone: string; // Required by Lulu
    email: string; // Required for Lulu
    level: ShippingLevel; // Standard, Expedited, Express
}

export interface PromoCode {
    code: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
}

export const paymentService = {
    /**
     * Fetch and validate a promo code from Supabase
     */
    validatePromoCode: async (code: string, userId?: string): Promise<PromoCode | null> => {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !data) return null;

        // Check expiration
        if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

        // Check general usage limits
        if (data.max_uses && data.current_uses >= data.max_uses) return null;

        return {
            code: data.code,
            discount_type: 'percent',
            discount_value: data.discount_percent
        };
    },

    /**
     * ANTI-BLEED LOGIC: Calculate best possible price for the user
     * Rules:
     * 1. Multi-Book Discounts (15% for 2, 20% for 3+)
     * 2. Promo Code (e.g., HERO25 = 25%)
     * 3. HIGHER of the two applies (No Stacking)
     * 4. Credits applied to Subtotal only (Cannot cover shipping)
     * 5. Referral Rewards (10% off next purchase) applied to final amount.
     */
    calculateOrderTotal: (items: CartItem[], promoCode: PromoCode | null, availableCredits: number = 0, referralRewards: any[] = []) => {
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        const itemCount = items.length;

        // 1. Calculate Bulk % (15% for 2 books, 20% for 3+)
        let bulkDiscountPercent = 0;
        if (itemCount >= 3) bulkDiscountPercent = 20;
        else if (itemCount >= 2) bulkDiscountPercent = PRICING.BULK_DISCOUNT_PERCENT;

        // 2. Calculate Promo % (if applicable)
        let promoDiscountTotal = 0;
        if (promoCode) {
            if (promoCode.discount_type === 'percent') {
                promoDiscountTotal = subtotal * (promoCode.discount_value / 100);
            } else {
                promoDiscountTotal = promoCode.discount_value;
            }
        }

        const bulkDiscountTotal = subtotal * (bulkDiscountPercent / 100);

        // 3. BEST DEAL RULE: Choose the best discount (No Stacking of Bulk vs Promo)
        const selectedDiscount = Math.max(bulkDiscountTotal, promoDiscountTotal);
        const discountType = selectedDiscount === bulkDiscountTotal ? 'BULK' : 'PROMO';

        // 4. Shipping (None for Digital)
        const requiresShipping = items.some(i => i.type === 'HARDCOVER' || i.type === 'BUNDLE');
        const shippingTotal = 0; // withholding hardcover for launch

        // 5. Apply Credits
        const amountAfterDiscount = subtotal - selectedDiscount;
        const finalSubtotal = Math.max(0, amountAfterDiscount - availableCredits);

        // 6. Stack Referral Rewards (10% each)
        const totalRewardPercent = referralRewards.reduce((sum, rw) => sum + (parseFloat(rw.reward_value) || PRICING.REFERRAL_REWARD_PERCENT), 0);
        const rewardAmount = Math.min(finalSubtotal, finalSubtotal * (totalRewardPercent / 100));

        return {
            subtotal,
            selectedDiscount,
            discountType,
            shippingTotal,
            total: finalSubtotal - rewardAmount,
            requiresShipping,
            referralRewardAmount: rewardAmount,
            referralRewardPercentage: totalRewardPercent
        };
    },

    // rewardReferrer moved to process-payment Edge Function

    /**
     * Update DB after successful Digital Payment via PayPal
     */
    processDigitalPayment: async (storyId: string, paypalOrderId: string, promoCode?: string) => {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                paypalOrderId,
                items: [{
                    id: 'single',
                    bookId: storyId,
                    type: 'DIGITAL',
                    price: PRICING.DIGITAL_SINGLE,
                    title: '25-Page Digital Story'
                }],
                promoCode
            }
        });

        if (error || (data && data.error)) {
            const msg = error?.message || data?.error || "Payment processing failed";
            console.error("Payment processing error:", msg);
            return { success: false, error: msg };
        }

        return { success: true };
    },

    /**
     * Process Hardcover Order via PayPal & Send to Lulu
     */
    orderHardcover: async (storyId: string, shipping: ShippingDetails, paypalOrderId: string, promoCode?: string) => {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                paypalOrderId,
                items: [{
                    id: 'single',
                    bookId: storyId,
                    type: 'HARDCOVER',
                    price: PRICING.HARDCOVER,
                    title: 'Premium Hardcover Book'
                }],
                shipping,
                promoCode
            }
        });

        if (error || (data && data.error)) {
            const msg = error?.message || data?.error || "Order processing failed";
            console.error("Hardcover ordering error:", msg);
            throw new Error(msg);
        }

        return { success: true, orderId: data.orderIds[0] };
    },

    /**
     * FULFILLMENT ENGINE: Generates PDFs and sends to Lulu.
     * Triggered only when a book reaches 'completed' status and has a pending order.
     */
    fulfillHardcoverOrder: async (bookId: string) => {
        console.log(`🚀 Starting Async Fulfillment for book: ${bookId}`);

        try {
            // 1. Fetch the Order
            const { data: order, error: orderErr } = await supabase
                .from('orders')
                .select('*')
                .eq('book_id', bookId)
                .eq('order_type', 'hardcover')
                .eq('fulfillment_status', 'pending_lulu')
                .single();

            if (orderErr || !order) {
                console.log("ℹ️ No pending hardcover order found for this book. Skipping fulfillment.");
                return;
            }

            // 2. Fetch the Story
            const { data: storyData } = await supabase
                .from('books')
                .select('*, pages(*)')
                .eq('id', bookId)
                .single();

            if (!storyData || !storyData.pages || storyData.pages.length === 0) {
                throw new Error("Story data or pages missing for fulfillment.");
            }

            // 3. Reconstruct Input for PDF Generator
            const reconstructionInput: UserInput = {
                childName: storyData.child_name,
                childAge: storyData.child_age,
                childGender: storyData.child_gender,
                characterDescription: storyData.character_description,
                category: storyData.category,
                prompt: storyData.original_prompt,
                pageCount: storyData.page_count,
                subtitle: storyData.subtitle,
                authorName: storyData.author_name,
                isbn: storyData.isbn,
                description: storyData.description,
                keywords: storyData.keywords,
                copyrightYear: storyData.copyright_year
            };

            const fullStory = {
                id: storyData.id,
                userId: storyData.user_id,
                title: storyData.title,
                category: storyData.category,
                pageCount: storyData.page_count,
                subtitle: storyData.subtitle,
                authorName: storyData.author_name,
                isbn: storyData.isbn,
                description: storyData.description,
                keywords: storyData.keywords,
                copyrightYear: storyData.copyright_year,
                pages: storyData.pages.sort((a: any, b: any) => a.page_number - b.page_number).map((p: any) => ({
                    pageNumber: p.page_number,
                    text: p.story_text,
                    imagePrompt: p.image_prompt,
                    imageUrl: p.generated_image_url,
                    coloredImageUrl: p.colored_image_url
                })),
                coverImage: storyData.pages?.find((p: any) => p.page_number === 1)?.generated_image_url,
            } as any;

            // 4. Generate & Upload PDFs (INFINITE RESOLUTION UPGRADE: ACTIVATED)
            console.log("🌟 Activating Infinite Resolution Engine for Hardcover...");
            const interiorBlob = await getLuluVectorInteriorBlob(fullStory, reconstructionInput);
            console.log("✅ Vector Interior Complete");
            const coverBlob = await getLuluVectorCoverBlob(fullStory, reconstructionInput); // Uses Vector Cover now
            console.log("✅ Vector Cover Complete");

            const { supabaseService } = await import('./supabaseService');
            const interiorUrl = await supabaseService.uploadPDF(storyData.user_id, bookId, 'interior', interiorBlob);
            const coverUrl = await supabaseService.uploadPDF(storyData.user_id, bookId, 'cover', coverBlob);

            // 5. Send to Lulu
            const shipping: ShippingDetails = {
                name: order.shipping_name,
                address: order.shipping_address.line1,
                city: order.shipping_address.city,
                state: order.shipping_address.state || '', // From JSON
                zip: order.shipping_address.zip,
                country: order.shipping_address.country,
                phone: order.shipping_address.phone || '000-000-0000',
                email: order.shipping_address.email || 'customer@childtale.com',
                level: (order.shipping_address.level as any) || 'MAIL'
            };

            const luluResponse = await luluService.createPrintJob(order.id, shipping, [{
                title: fullStory.title,
                coverUrl,
                interiorUrl,
                quantity: 1,
                paperType: '80# coated',
                bindingType: 'hardcover'
            }]);

            if (luluResponse.success && luluResponse.luluJobId) {
                await supabase.from('orders').update({
                    fulfillment_status: 'sent_to_printer',
                    fulfillment_provider_id: luluResponse.luluJobId
                }).eq('id', order.id);
                console.log(`✅ Lulu Job Created: ${luluResponse.luluJobId}`);
            } else {
                throw new Error(luluResponse.error || "Lulu API submission failed.");
            }

        } catch (err: any) {
            console.error("❌ Async Fulfillment Error:", err.message);
            // We leave the order as 'pending_lulu' so it can be retried later
        }
    },

    /**
     * Process Cart Checkout (Batch) via PayPal
     */
    processCartCheckout: async (items: CartItem[], shipping: ShippingDetails | null, paypalOrderId: string, promoCode?: string) => {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                paypalOrderId,
                items: items.map(i => ({
                    id: i.id,
                    bookId: i.bookId,
                    type: i.type,
                    price: i.price,
                    title: i.title
                })),
                shipping,
                promoCode
            }
        });


        if (error || (data && data.error)) {
            const msg = error?.message || data?.error || "Batch checkout failed";
            console.error("Cart checkout error:", msg);
            console.error("Full error object:", error);
            console.error("Full data object:", data);
            console.error("Error details:", {
                errorMessage: error?.message,
                errorContext: error?.context,
                dataError: data?.error,
                dataDetails: data?.details
            });
            throw new Error(msg);
        }

        return { success: true };
    }
};
