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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header");

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) throw new Error("Unauthorized");

        const { action, payload } = await req.json()


        // ACTION: Update Book Status & Payment
        if (action === 'update-book-privileged') {
            const { bookId, status, isPurchased } = payload;

            // Verify ownership first using service_role
            const { data: book, error: checkError } = await supabase
                .from('books')
                .select('user_id')
                .eq('id', bookId)
                .single()

            if (checkError || !book) throw new Error("Book not found");
            if (book.user_id !== user.id) throw new Error("Unauthorized: You do not own this book");

            const updates: any = { status };
            if (isPurchased !== undefined) updates.is_purchased = isPurchased;

            const { error: updateError } = await supabase
                .from('books')
                .update(updates)
                .eq('id', bookId)

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ACTION: Record Sample
        if (action === 'record-sample') {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ last_sample_at: new Date().toISOString() })
                .eq('id', user.id)

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
