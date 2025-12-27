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
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

        // 0. Initialize Supabase Service Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { record, type } = await req.json()
        console.log(`Notification Trigger: ${type} on orders`, record)

        // Only send notification if status changed to something important
        if (type !== 'UPDATE' && type !== 'INSERT') return new Response('Ignored');

        const { shipping_status, tracking_number, user_id, id: orderId } = record;

        // 1. Fetch User Email from Auth
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
        if (userError || !userData.user) throw new Error("User not found for notification");
        const recipientEmail = userData.user.email;

        let subject = "";
        let html = "";

        if (type === 'INSERT' || (type === 'UPDATE' && shipping_status === 'pending')) {
            subject = "Your ChildTale Adventure is being printed! 📖";
            html = `<h1>Great news!</h1><p>Your order #${orderId} has been sent to our magical printing press. We'll let you know as soon as it's ready to fly to you.</p>`;
        } else if (shipping_status === 'shipped') {
            subject = "Your Book is on its way! 🚀";
            html = `<h1>It's flying!</h1><p>Your ChildTale book has shipped. Tracking Number: <strong>${tracking_number || 'Available soon'}</strong></p>`;
        } else {
            return new Response('No action needed');
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ChildTale <magic@childtale.com>",
                to: [recipientEmail],
                subject: subject,
                html: html,
            }),
        });

        const resData = await res.json();
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Notification Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
