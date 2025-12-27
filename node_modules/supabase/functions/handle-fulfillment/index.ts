// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


// Environment Configuration
const IS_SANDBOX = Deno.env.get('LULU_IS_SANDBOX') === 'true';

const LULU_AUTH_URL = IS_SANDBOX
    ? 'https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token'
    : 'https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token';

const LULU_API_BASE = IS_SANDBOX
    ? 'https://api.sandbox.lulu.com/'
    : 'https://api.lulu.com/';

console.log(`Lulu Service initializing in ${IS_SANDBOX ? 'SANDBOX' : 'PRODUCTION'} mode`);

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 0. Auth Check
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header");

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) throw new Error("Unauthorized");

        const { action, payload } = await req.json()

        // Retrieve Secrets
        const CLIENT_KEY = Deno.env.get('LULU_CLIENT_KEY');
        const CLIENT_SECRET = Deno.env.get('LULU_CLIENT_SECRET');

        if (!CLIENT_KEY || !CLIENT_SECRET) {
            throw new Error("Lulu Credentials not configured on server.");
        }

        // Helper: Get Token
        const getLuluToken = async () => {
            const params = new URLSearchParams();
            params.append('client_id', CLIENT_KEY);
            params.append('client_secret', CLIENT_SECRET);
            params.append('grant_type', 'client_credentials');

            const authRes = await fetch(LULU_AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            if (!authRes.ok) {
                const authErrText = await authRes.text();
                console.error(`Lulu Auth Failed (${authRes.status}):`, authErrText);
                throw new Error(
                    `Failed to authenticate with Lulu (${authRes.status}). ` +
                    `Mode: ${IS_SANDBOX ? 'SANDBOX' : 'PRODUCTION'}. ` +
                    `URL: ${LULU_AUTH_URL}. ` +
                    `Details: ${authErrText}`
                );
            }
            const data = await authRes.json();
            return data.access_token;
        }

        if (action === 'create-print-job') {
            const { orderId, shipping_address, line_items, shipping_level } = payload;

            const token = await getLuluToken();

            const luluPayload = {
                contact_email: shipping_address.email || "support@childtale.ai",
                external_id: orderId,
                line_items,
                shipping_address,
                shipping_level: shipping_level || 'MAIL'
            };

            const redactedPayload = { ...luluPayload };
            if (redactedPayload.shipping_address) redactedPayload.shipping_address = "[REDACTED]";
            if (redactedPayload.line_items) redactedPayload.line_items = "[REDACTED]"; // Optional, but usually contains titles

            console.log("Sending Print Job to Lulu:", JSON.stringify(redactedPayload, null, 2));

            const jobRes = await fetch(`${LULU_API_BASE}print-jobs/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(luluPayload)
            });

            if (!jobRes.ok) {
                const errText = await jobRes.text();
                throw new Error(`Lulu API Failed: ${errText}`);
            }

            const jobData = await jobRes.json();

            return new Response(JSON.stringify({
                success: true,
                luluJobId: jobData.id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }


        if (action === 'get-shipping-cost') {
            const { shipping_address, line_items, shipping_level } = payload;

            try {
                const token = await getLuluToken();

                const costPayload = {
                    line_items,
                    shipping_address,
                    shipping_level: shipping_level || 'MAIL'
                };

                const costRes = await fetch(`${LULU_API_BASE}print-job-cost-calculations/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(costPayload)
                });

                if (!costRes.ok) {
                    const errText = await costRes.text();
                    console.error(`Lulu Cost Error (${costRes.status}):`, errText);
                    throw new Error(`Failed to calculate shipping costs (${costRes.status}): ` + errText);
                }

                const costData = await costRes.json();
                return new Response(JSON.stringify(costData), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })

            } catch (error) {
                console.error("Lulu Service Failed:", error);
                throw error; // No more mock fallback
            }
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error) {
        // ... (outer catch block)
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})


