
import { ShippingDetails } from "./paymentService";
import { supabase } from "../utils/supabaseClient";

// Interface for a Lulu Print Job
interface PrintJobItem {
    title: string;
    coverUrl: string; // URL to the generated cover PDF
    interiorUrl: string; // URL to the generated interior PDF
    quantity: number;
    paperType: '60# cream' | '60# white' | '80# coated';
    bindingType: 'hardcover' | 'perfect';
}



export const luluService = {

    /**
     * Calculates shipping rates via Supabase Edge Function
     */
    getShippingRate: async (address: ShippingDetails, quantity: number = 1): Promise<number> => {
        try {
            const { data, error } = await supabase.functions.invoke('handle-fulfillment', {
                body: {
                    action: 'get-shipping-cost',
                    payload: {
                        line_items: [{
                            page_count: 24,
                            pod_package_id: "0850X1100FCSTDCW080CW444GXX", // Valid 27-char ID (8.5x11 Hardcover Color)
                            quantity: quantity
                        }],
                        shipping_address: {
                            name: address.name || "Valued Customer",
                            street1: address.address,
                            city: address.city,
                            country_code: address.country, // Use actual country code
                            postcode: address.zip,
                            phone_number: address.phone || "555-555-5555",
                            email: address.email || "support@childtale.ai",
                            ...(address.state ? { state_code: address.state } : {})
                        }
                    }
                }
            });

            if (error) {
                console.error("Supabase Call Failed:", error);
                throw error;
            }
            if (data.error) {
                console.error("Lulu API Error:", data.error);
                throw new Error(data.error);
            }

            // data.shipping_cost.total_cost_excl_tax
            const shipping = parseFloat(data.shipping_cost?.total_cost_excl_tax);
            return isNaN(shipping) ? 9.99 : shipping;

        } catch (error: any) {
            console.error("Lulu Shipping Rate Error Details:", {
                message: error.message,
                stack: error.stack
            });
            // Fallback to flat rate if API fails
            return 9.99;
        }
    },

    /**
     * Creates a Print Job via Supabase Edge Function
     */
    async createPrintJob(orderId: string, shipping: any, items: any[]): Promise<{ success: boolean; luluJobId?: string; error?: string }> {
        try {
            // Pre-flight check: Ensure all items have valid PDF URLs
            for (const item of items) {
                if (!item.coverUrl || !item.interiorUrl) {
                    console.error("❌ Print job failed: Missing PDF URLs for item", item.title);
                    throw new Error(`Cannot submit print job: Missing PDF URLs for ${item.title}. Ensure PDFs are generated and uploaded first.`);
                }
            }

            const payload = {
                orderId: orderId,
                shipping_level: shipping.level || 'MAIL',
                line_items: items.map(item => ({
                    title: item.title,
                    cover: item.coverUrl,
                    interior: item.interiorUrl,
                    pod_package_id: "0850X1100FCSTDCW080CW444GXX", // Valid 27-char ID
                    quantity: item.quantity
                })),
                shipping_address: {
                    name: shipping.name,
                    street1: shipping.address,
                    city: shipping.city,
                    country_code: shipping.country,
                    postcode: shipping.zip,
                    phone_number: shipping.phone || "555-555-5555",
                    email: shipping.email || "support@childtale.ai",
                    ...(shipping.state ? { state_code: shipping.state } : {})
                }
            };

            const { data, error } = await supabase.functions.invoke('handle-fulfillment', {
                body: {
                    action: 'create-print-job',
                    payload
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return { success: true, luluJobId: data.luluJobId };

        } catch (error: any) {
            console.error("Lulu API Error:", error);
            return { success: false, error: error.message };
        }
    }
};
