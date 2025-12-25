// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const WEBHOOK_SECRET = Deno.env.get('LULU_WEBHOOK_SECRET')
        const headerSecret = req.headers.get('X-Lulu-Webhook-Secret')

        if (WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET) {
            console.error("Unauthorized webhook call: Secret mismatch")
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Lulu sends a POST body with status updates
        const body = await req.json()

        // ROBUST PII REDACTION
        const logBody = JSON.parse(JSON.stringify(body)); // Deep copy
        if (logBody.shipping_info) {
            logBody.shipping_info = {
                city: logBody.shipping_info.city,
                country_code: logBody.shipping_info.country_code,
                redacted: true
            };
        }
        if (logBody.line_items) {
            logBody.line_items = logBody.line_items.map(item => ({
                title: "[REDACTED]",
                quantity: item.quantity,
                external_id: item.external_id
            }));
        }
        if (logBody.contact_email) logBody.contact_email = "[REDACTED]";

        console.log("Received Lulu Webhook (PII Redacted):", JSON.stringify(logBody, null, 2))

        const { status, id: luluJobId, external_id: orderId, shipping_info } = body;

        // Map Lulu status to our internal status
        // Lulu Statuses: CREATED, IN_PRODUCTION, PRINTED, SHIPPED, CANCELLED, etc.
        let shippingStatus = 'pending';
        if (status.name === 'SHIPPED') shippingStatus = 'shipped';
        if (status.name === 'PRINTED') shippingStatus = 'printed';
        if (status.name === 'CANCELLED') shippingStatus = 'failed';

        const updateData: any = {
            shipping_status: shippingStatus,
            updated_at: new Date().toISOString()
        }

        if (shipping_info && shipping_info.tracking_number) {
            updateData.tracking_number = shipping_info.tracking_number;
        }

        // Update the order in Supabase
        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('fulfillment_provider_id', luluJobId.toString())

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Webhook Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
