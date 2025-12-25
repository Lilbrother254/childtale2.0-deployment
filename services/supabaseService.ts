
import { supabase } from '../utils/supabaseClient';
import { Story, StoryPage, UserInput, UserProfile } from '../types';
import BinaryWorker from '../src/workers/binary.worker?worker';

export const supabaseService = {
    // --- Profile & Credits ---
    async getProfile(userId: string, retryAttempt: number = 0): Promise<UserProfile | null> {
        const maxRetries = 3;
        const timeoutMs = 8000; // Reduced from 15s to 8s
        const retryDelays = [0, 2000, 4000]; // Exponential backoff: 0s, 2s, 4s

        console.log(`🔍 Fetching profile for: ${userId}${retryAttempt > 0 ? ` (attempt ${retryAttempt + 1}/${maxRetries})` : ''}`);

        const fetchPromise = (async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            return data;
        })();

        const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => {
            reject(new Error(`Profile fetch timed out (${timeoutMs}ms). Database may be asleep or connection slow.`));
        }, timeoutMs));

        try {
            const start = Date.now();
            const data: any = await Promise.race([fetchPromise, timeoutPromise]);
            const duration = Date.now() - start;
            if (duration > 3000) console.warn(`🐌 Profile fetch took ${duration}ms`);

            if (!data) {
                console.log("📭 Profile not found in database");

                // Retry if profile doesn't exist and we haven't exhausted retries
                if (retryAttempt < maxRetries - 1) {
                    const delay = retryDelays[retryAttempt + 1];
                    console.log(`⏳ Retrying in ${delay}ms (profile may be creating via trigger)...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.getProfile(userId, retryAttempt + 1);
                }

                return null;
            }

            console.log("✅ Profile fetched successfully");
            return {
                id: data.id,
                email: data.email,
                samplesUsed: data.samples_used,
                storeCreditBalance: data.store_credit_balance || 0,
                isAdmin: data.is_admin || false,
                lastSampleAt: data.last_sample_at
            };
        } catch (err) {
            const isTimeout = err instanceof Error && err.message.includes('timed out');

            if (isTimeout) {
                console.warn(`⏱️ Profile fetch timeout (${timeoutMs}ms)`);
            } else {
                console.error("❌ Profile fetch error:", err);
            }

            // Retry on timeout if we haven't exhausted retries
            if (isTimeout && retryAttempt < maxRetries - 1) {
                const delay = retryDelays[retryAttempt + 1];
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.getProfile(userId, retryAttempt + 1);
            }

            // Return null instead of throwing - let caller handle gracefully
            return null;
        }
    },

    async createProfile(userId: string, email: string): Promise<UserProfile> {
        console.log("✨ Creating profile for:", email);

        const createPromise = (async () => {
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: email,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id',
                    ignoreDuplicates: false // We want to update email if it changed
                })
                .select()
                .single();


            if (error) {
                console.error("❌ Profile creation error:", error);
                console.error("❌ Full error details:", JSON.stringify(error, null, 2));
                console.error("❌ Error code:", error.code);
                console.error("❌ Error message:", error.message);
                console.error("❌ Error hint:", error.hint);
                console.error("❌ Error details:", error.details);
                throw error;
            }
            return data;
        })();

        const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => {
            reject(new Error("Profile creation timed out."));
        }, 10000));

        const data: any = await Promise.race([createPromise, timeoutPromise]);

        if (!data) throw new Error("Failed to create profile (timeout). Database may be propagating.");

        console.log("✅ Profile created for:", data.email);

        return {
            id: data.id,
            email: data.email,
            samplesUsed: data.samples_used,
            storeCreditBalance: data.store_credit_balance || 0,
            isAdmin: data.is_admin || false,
            lastSampleAt: data.last_sample_at
        };
    },

    async updateSamplesUsed(userId: string, _count: number) {
        // Direct update blocked by RLS. Use Edge Function instead.
        await this.recordSampleUsed(userId);
    },

    async recordSampleUsed(_userId: string) {
        // userId is pulled from auth header in function
        await supabase.functions.invoke('book-manager', {
            body: { action: 'record-sample' }
        });
    },


    // --- Story Persistence ---
    async createBook(userId: string, input: UserInput, title: string, status: string = 'generating'): Promise<string> {
        console.log("✨ createBook starting for:", title);

        const insertPromise = (async () => {
            const { data, error } = await supabase.from('books').insert({
                user_id: userId,
                title: title,
                category: input.category,
                child_name: input.childName,
                child_age: input.childAge,
                child_gender: input.childGender,
                character_description: input.characterDescription,
                original_prompt: input.prompt,
                page_count: input.pageCount,
                status: status,
                subtitle: input.subtitle,
                author_name: input.authorName,
                isbn: input.isbn,
                description: input.description,
                keywords: input.keywords,
                copyright_year: input.copyrightYear
            }).select('id').single();

            if (error) {
                console.error("❌ createBook Database Error:", error);
                throw error;
            }
            return data.id;
        })();

        const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => {
            reject(new Error("Magic book creation timed out (30s). Please check your connection."));
        }, 30000));

        return await Promise.race([insertPromise, timeoutPromise]);
    },

    async updateBookStatus(bookId: string, status: string, isPurchased?: boolean) {
        const { error } = await supabase.functions.invoke('book-manager', {
            body: {
                action: 'update-book-privileged',
                payload: { bookId, status, isPurchased }
            }
        });

        if (error) {
            console.error("Failed to update book status via Edge Function:", error);
            // Fallback for non-privileged status updates if needed (not likely here)
            throw error;
        }

        // If the book just finished generation, check if it needs to be sent to Lulu
        if (status === 'completed') {
            try {
                const { paymentService } = await import('./paymentService');
                // We fire and forget the fulfillment so it doesn't block the UI refresh
                paymentService.fulfillHardcoverOrder(bookId).catch(err => {
                    console.error("Critical: Failed to trigger async fulfillment:", err);
                });
            } catch (err) {
                console.error("Failed to import paymentService for fulfillment:", err);
            }
        }
    },

    async updateBookReference(bookId: string, referenceUrl: string, castBible: string) {
        await supabase.from('books').update({
            character_reference_url: referenceUrl,
            character_description: castBible
        }).eq('id', bookId);
    },

    async setRegenerated(bookId: string) {
        await supabase.from('books').update({ has_been_regenerated: true }).eq('id', bookId);
    },

    async setBookPublic(bookId: string, isPublic: boolean = true) {
        await supabase.from('books').update({ is_public: isPublic }).eq('id', bookId);
    },

    async deleteBook(bookId: string) {
        // Pages will delete automatically if foreign keys are CASCADE
        // For safety, we delete them explicitly if not
        await supabase.from('pages').delete().eq('book_id', bookId);
        await supabase.from('books').delete().eq('id', bookId);
    },

    async deletePages(bookId: string) {
        await supabase.from('pages').delete().eq('book_id', bookId);
    },

    async deleteAccount(userId: string) {
        // All related data (books, pages, orders, referral_rewards) 
        // will delete automatically due to ON DELETE CASCADE at the DB level.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
    },

    // --- Image Storage ---


    // --- Image Storage ---
    async uploadImage(userId: string, bookId: string, pageNumber: number | string, base64: string, isColored: boolean = false): Promise<string> {
        const bucket = isColored ? 'colored-masterpieces' : 'story-images';
        const filePath = `${userId}/${bookId}/page_${pageNumber}.png`;

        console.log(`[STORAGE] Uploading to ${bucket}: ${filePath}`, { userId, bookId, pageNumber });

        // Offload Binary Conversion to Worker
        const blob = await new Promise<Blob>((resolve, reject) => {
            const worker = new BinaryWorker();
            const id = Math.random().toString(36).substring(7);

            worker.onmessage = (e) => {
                if (e.data.id === id) {
                    if (e.data.error) reject(new Error(e.data.error));
                    else resolve(e.data.blob);
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                reject(err);
                worker.terminate();
            };

            worker.postMessage({ id, action: 'base64ToBlob', data: base64, contentType: 'image/png' });
        });

        const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
            upsert: true,
            contentType: 'image/png'
        });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return publicUrl;
    },

    // --- Page Persistence ---
    async addPage(bookId: string, page: StoryPage) {
        await supabase.from('pages').insert({
            book_id: bookId,
            page_number: page.pageNumber,
            story_text: page.text,
            image_prompt: page.imagePrompt,
            generated_image_url: page.imageUrl
        });
    },

    async updatePageColor(bookId: string, pageNumber: number, coloredUrl: string) {
        await supabase.from('pages')
            .update({ colored_image_url: coloredUrl })
            .eq('book_id', bookId)
            .eq('page_number', pageNumber);
    },



    // --- PDF Storage (For Hardcover Fulfillment) ---
    async uploadPDF(userId: string, bookId: string, type: 'interior' | 'cover', blob: Blob): Promise<string> {
        const bucket = 'pdfs';
        const timestamp = Date.now();
        const filePath = `${userId}/${bookId}/${type}_${timestamp}.pdf`;
        console.log(`[STORAGE] Uploading to ${bucket}: ${filePath}`, { userId, bookId, type });

        const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
            upsert: true,
            contentType: 'application/pdf'
        });

        if (error) {
            console.error(`❌ PDF Upload failed for ${type}:`, error);
            throw error;
        }

        console.log(`✅ ${type} PDF uploaded. Creating signed URL...`);

        // Get Signed URL (valid for 24 hours)
        const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(filePath, 86400);

        if (signedError) {
            console.error(`❌ Failed to create signed URL for ${type}:`, signedError);
            throw signedError;
        }

        console.log(`🔗 Signed URL created:`, data.signedUrl.substring(0, 50) + "...");
        return data.signedUrl;
    },

    // --- Fetching ---
    async getUserLibrary(userId: string, page: number = 0, limit: number = 12): Promise<{ stories: Story[], total: number }> {
        const from = page * limit;
        const to = from + limit - 1;

        // 1. Fetch count and metadata only (no pages!)
        const { data: books, error, count } = await supabase
            .from('books')
            .select(`
                *,
                pages:pages(generated_image_url, colored_image_url)
            `, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        const stories = (books || []).map(book => ({
            ...this._mapBookToStory(book),
            pages: [] // Explicitly empty until hydrated
        }));

        return { stories, total: count || 0 };
    },

    async getBookDetails(bookId: string): Promise<Story | null> {
        const { data: book, error } = await supabase
            .from('books')
            .select('*, pages(*)')
            .eq('id', bookId)
            .single();

        if (error || !book) return null;
        return this._mapBookToStory(book);
    },

    async getUserStories(userId: string): Promise<Story[]> {
        // Legacy/Full fetch for small libraries or specific views
        const { data: books, error } = await supabase
            .from('books')
            .select('*, pages(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // SAFETY NET: Filter out 'completed' books with no pages (data integrity issue)
        const safeBooks = (books || []).filter(book => {
            if (book.status === 'completed' && (!book.pages || book.pages.length === 0)) {
                console.warn(`⚠️ Filtering out empty completed book: ${book.id} (${book.title})`);
                return false;
            }
            return true;
        });

        return safeBooks.map(book => this._mapBookToStory(book));
    },

    _mapBookToStory(book: any): Story {
        return {
            id: book.id,
            userId: book.user_id,
            createdAt: book.created_at,
            title: book.title,
            category: book.category,
            status: book.status as any,
            isPurchased: book.is_purchased,
            hasBeenRegenerated: book.has_been_regenerated,
            pageCount: book.page_count,
            childName: book.child_name,
            childAge: book.child_age,
            childGender: book.child_gender,
            characterDescription: book.character_description,
            characterReferenceUrl: book.character_reference_url,
            originalPrompt: book.original_prompt,
            subtitle: book.subtitle,
            authorName: book.author_name,
            isbn: book.isbn,
            description: book.description,
            keywords: book.keywords,
            copyrightYear: book.copyright_year,
            coverImage: (() => {
                const page1 = book.pages?.find((p: any) => p.page_number === 1) || book.pages?.[0];
                return page1?.colored_image_url || page1?.generated_image_url;
            })(),
            pages: (book.pages || []).sort((a: any, b: any) => a.page_number - b.page_number).map((p: any) => ({
                pageNumber: p.page_number,
                text: p.story_text,
                imagePrompt: p.image_prompt,
                imageUrl: p.generated_image_url,
                coloredImageUrl: p.colored_image_url
            }))
        };
    },

    async getPublicStory(storyId: string): Promise<Story | null> {
        const { data, error } = await supabase.functions.invoke('get-public-story', {
            body: { storyId }
        });

        if (error || data.error) {
            console.error("Failed to fetch public story:", error || data.error);
            return null;
        }

        return data as Story;
    },

    // --- Referrals & Rewards ---
    async recordReferral(referrerId: string, referredEmail: string) {
        await supabase.from('referrals').upsert({
            referrer_id: referrerId,
            referred_email: referredEmail,
            status: 'joined'
        }, { onConflict: 'referred_email' });
    },

    async getPendingRewards(userId: string) {
        const { data, error } = await supabase
            .from('referral_rewards')
            .select('*')
            .eq('user_id', userId)
            .eq('is_redeemed', false);

        if (error) return [];
        return data;
    },

    async hasReachedMonthlySampleLimit(userId: string): Promise<boolean> {
        const { data: profile } = await supabase
            .from('profiles')
            .select('last_sample_at')
            .eq('id', userId)
            .maybeSingle();

        if (!profile || !profile.last_sample_at) return false;

        const lastSample = new Date(profile.last_sample_at);
        const now = new Date();

        return (
            lastSample.getMonth() === now.getMonth() &&
            lastSample.getFullYear() === now.getFullYear()
        );
    },

    async redeemReward(rewardId: string) {
        await supabase.from('referral_rewards').update({ is_redeemed: true }).eq('id', rewardId);
    },

    async validateCartBooks(bookIds: string[]): Promise<string[]> {
        if (!bookIds.length) return [];
        const { data, error } = await supabase
            .from('books')
            .select('id')
            .in('id', bookIds);

        if (error) return [];
        return data.map(b => b.id);
    }
};
