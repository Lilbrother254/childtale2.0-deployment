// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log("Starting Storage Cleanup...")

        // 0. Security Check: Ensure caller is authenticated and is an admin
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) {
            console.error("Auth Failed:", authError?.message);
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), { status: 401 });
        }

        // Admin check
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            console.error("Authorization Failed: User is not an admin", user.id);
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }

        // 1. List files in the 'pdfs' bucket
        const { data: files, error: listError } = await supabase
            .storage
            .from('pdfs')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'asc' },
            })

        if (listError) throw listError;

        // 2. Filter files older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const filesToDelete = files
            .filter(file => new Date(file.created_at) < sevenDaysAgo)
            .map(file => file.name);

        if (filesToDelete.length === 0) {
            console.log("No old files to delete.");
            return new Response(JSON.stringify({ message: "No cleanup needed" }));
        }

        console.log(`Deleting ${filesToDelete.length} files:`, filesToDelete);

        // 3. Delete the files
        const { error: deleteError } = await supabase
            .storage
            .from('pdfs')
            .remove(filesToDelete);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({
            success: true,
            deletedCount: filesToDelete.length
        }));

    } catch (error) {
        console.error("Cleanup Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
})
