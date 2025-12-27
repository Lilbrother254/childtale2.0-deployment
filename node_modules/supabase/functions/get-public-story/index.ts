// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { storyId } = await req.json()
        if (!storyId) throw new Error("Missing storyId")

        // Create a Supabase client with the SERVICE ROLE KEY to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch Book
        const { data: book, error: bookError } = await supabaseAdmin
            .from('books')
            .select('*')
            .eq('id', storyId)
            .single()

        if (bookError || !book) {
            throw new Error("Story not found")
        }

        // Security Check: Only allow viewing if is_public is true
        if (!book.is_public) {
            throw new Error("This story hasn't been shared yet")
        }

        // 2. Fetch Pages
        const { data: pages, error: pageError } = await supabaseAdmin
            .from('pages')
            .select('*')
            .eq('book_id', storyId)
            .order('page_number', { ascending: true })

        if (pageError) {
            throw new Error("Failed to load pages")
        }

        // 3. Format Response (Match client-side Story interface)
        const story = {
            id: book.id,
            userId: book.user_id, // Exposed but generally safe (UUID)
            title: book.title,
            childName: book.child_name,
            childAge: book.child_age,
            childGender: book.child_gender,
            characterDescription: book.character_description,
            originalPrompt: book.original_prompt,
            pageCount: book.page_count,
            category: book.category,
            status: book.status,
            isPurchased: book.is_purchased,
            createdAt: book.created_at,
            pages: pages.map((p: any) => ({
                pageNumber: p.page_number,
                text: p.story_text,
                imagePrompt: p.image_prompt,
                imageUrl: p.generated_image_url,
                coloredImageUrl: p.colored_image_url
            }))
        }

        return new Response(JSON.stringify(story), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
