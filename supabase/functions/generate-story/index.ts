// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createClient as createGeminiClient } from "npm:@google/genai@^1.34.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        // 1. Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header");

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) throw new Error("Unauthorized");

        const { action, payload } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY environment variable')
        }

        console.log(`🚀 Edge Function Action: ${action} for user: ${user.email}`);

        // Initialize the new Google Gen AI SDK
        const client = createGeminiClient({
            apiKey: apiKey,
            // By default it uses Google AI (Studio), which is what we need.
        });

        if (action === 'chat') {
            const { messages, systemPrompt } = payload;
            console.log("💬 Chat Request:", messages[messages.length - 1].content);

            // Correct history format for @google/genai
            const history = messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

            // Use gemini-3-flash-preview as requested
            const response = await client.models.generateContent({
                model: "gemini-3-flash-preview",
                systemInstruction: systemPrompt,
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text: messages[messages.length - 1].content }] }
                ]
            });

            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "Sparky is speechlessly magical right now!";
            console.log("✅ Chat Response Success");

            return new Response(JSON.stringify({ text }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'generate-story') {
            const { systemPrompt, userPrompt } = payload;
            console.log("📚 Story Generation Request:", userPrompt);

            // Use gemini-3-flash-preview for story structure
            const response = await client.models.generateContent({
                model: "gemini-3-flash-preview",
                systemInstruction: systemPrompt,
                contents: [
                    { role: 'user', parts: [{ text: userPrompt }] }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            console.log("✅ Story Structure Success");

            return new Response(JSON.stringify({ text }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'generate-image') {
            const { prompts, model, base64Image, mimeType } = payload;
            const targetModel = model || "gemini-2.5-flash-image"; // gemini-2.5-flash-image is "Nano Banana"
            console.log(`🎨 Image Generation Request (${targetModel}):`, Array.isArray(prompts) ? prompts[0] : prompts);

            let parts: any[] = [];

            // Add Image References for Multi-Image Fusion (multimodal)
            if (base64Image) {
                const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
                parts.push({
                    inlineData: {
                        mimeType: mimeType || 'image/png',
                        data: cleanBase64
                    }
                });
                console.log("🖼️ Included Reference Image (Cast Bible)");
            }

            // Add text prompts
            if (Array.isArray(prompts)) {
                prompts.forEach(p => parts.push({ text: p }));
            } else if (typeof prompts === 'string') {
                parts.push({ text: prompts });
            }

            const response = await client.models.generateContent({
                model: targetModel,
                contents: [{ parts }]
            });

            let generatedImageBase64 = null;
            let responseText = "";

            if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    } else if (part.text) {
                        responseText = part.text;
                    }
                }
            }

            console.log("✅ Image Generation Success");

            return new Response(JSON.stringify({
                text: responseText,
                image: generatedImageBase64
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error('Invalid action')

    } catch (error: any) {
        console.error('❌ Edge Function Final Catch:', error);

        // Determine error type and appropriate status code
        let statusCode = 500;
        let userMessage = 'An unexpected error occurred. Please try again later.';

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = JSON.stringify(error);

        // Enhanced Error Logging for Console
        console.log(`DEBUG ERROR DATA: ${errorString}`);

        // Check for quota/rate limit errors (429)
        if (errorString.includes('429') ||
            errorString.includes('quota') ||
            errorString.includes('Quota exceeded') ||
            errorString.includes('Too Many Requests') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('429')) {
            statusCode = 429;
            userMessage = '🌟 Our magic is taking a quick break! We\'ve hit our daily magic limit. Please try again in a few hours, or contact us at childtale4@gmail.com for immediate assistance.';
        }
        else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
            statusCode = 401;
            userMessage = 'Authentication failed. Please sign in again.';
        }

        return new Response(JSON.stringify({
            error: userMessage,
            details: errorMessage,
            code: statusCode
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so the client can read the custom error message body
        })
    }
})
