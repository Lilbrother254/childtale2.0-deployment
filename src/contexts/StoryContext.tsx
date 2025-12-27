
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Story, UserInput, GenerationProgress, StoryPage } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import * as geminiService from '../../services/geminiService';
import { useAuth } from './AuthContext';

interface StoryContextType {
    stories: Story[];
    activeStory: Story | null;
    setActiveStory: (story: Story | null) => void;

    // Generation
    generateStory: (input: UserInput, existingBookId?: string) => Promise<void>;
    generationProgress: GenerationProgress | null;
    isGenerating: boolean;
    deleteStory: (id: string) => Promise<void>;
    regenerateStory: (story: Story) => Promise<void>;
    saveColoringPage: (bookId: string, pageIndex: number, dataUrl: string) => Promise<void>;
    hydrateStory: (storyId: string) => Promise<Story | null>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
    isInitialLoading: boolean;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [activeStory, setActiveStory] = useState<Story | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalBooks, setTotalBooks] = useState(0);

    // Background Queue
    const processingQueue = useRef<Set<string>>(new Set());

    // Fetch Stories on User Change
    useEffect(() => {
        if (user) {
            setIsInitialLoading(true);
            setPage(0);
            supabaseService.getUserLibrary(user.id, 0)
                .then(({ stories: metaStories, total }) => {
                    setStories(metaStories);
                    setTotalBooks(total);
                    setHasMore(metaStories.length < total);
                })
                .catch(console.error)
                .finally(() => setIsInitialLoading(false));
        } else {
            setStories([]);
            setActiveStory(null);
            setIsInitialLoading(false);
            setHasMore(false);
        }
    }, [user?.id]);

    const loadMore = async () => {
        if (!user || !hasMore || isInitialLoading) return;
        const nextPage = page + 1;
        const { stories: moreStories, total } = await supabaseService.getUserLibrary(user.id, nextPage);
        setStories(prev => [...prev, ...moreStories]);
        setPage(nextPage);
        setHasMore([...stories, ...moreStories].length < total);
    };

    const hydrateStory = async (storyId: string): Promise<Story | null> => {
        const existing = stories.find(s => s.id === storyId);
        if (existing && existing.pages.length > 0) return existing;

        try {
            const hydrated = await supabaseService.getBookDetails(storyId);
            if (hydrated) {
                setStories(prev => prev.map(s => s.id === storyId ? hydrated : s));
                if (activeStory?.id === storyId) setActiveStory(hydrated);
                return hydrated;
            }
        } catch (err) {
            console.error("Hydration failed:", err);
        }
        return null;
    };

    // Background Processing Loop
    useEffect(() => {
        if (!user) return;
        // Identify stories that are 'generating' but not in queue
        const backgroundStories = stories.filter(s => s.status === 'generating' && !processingQueue.current.has(s.id));

        backgroundStories.forEach(story => {
            processingQueue.current.add(story.id);
            processBackgroundStory(story);
        });
    }, [stories, user]);

    async function processBackgroundStory(story: Story, shouldRefund: boolean = false) {
        if (!user) return;
        try {
            // Re-construct basic input from story data (fallback if partial)
            const input: UserInput = {
                category: story.category,
                childName: story.childName,
                childAge: story.childAge,
                childGender: story.childGender,
                characterDescription: story.characterDescription || '',
                prompt: story.originalPrompt || '',
                pageCount: story.pageCount
            };

            const structure = await geminiService.generateStoryStructure(
                input.childName,
                input.childAge,
                input.childGender,
                input.category,
                input.prompt,
                input.characterDescription,
                story.pageCount
            );
            await supabaseService.updateBookStatus(story.id, 'generating');

            // NEW: Generate Cast Bible first for character consistency
            const charRefBase64 = await geminiService.generateCharacterReference(
                input.childName,
                input.childAge,
                input.characterDescription,
                structure.characterDescription
            );

            let characterReferenceUrl = '';
            if (charRefBase64) {
                // Determine file extension from base64 string
                // Usually "data:image/png;base64,..."
                // But for safety within uploadImage, we often just pass the base64 or a blob
                // Uploading "Cast Bible" to storage...
                characterReferenceUrl = await supabaseService.uploadImage(user.id, story.id, 'master_reference', charRefBase64);
                await supabaseService.updateBookReference(story.id, characterReferenceUrl, structure.characterDescription);
            }

            for (let i = 0; i < structure.pages.length; i++) {
                // Pass the Cast Bible Reference to the page generator
                const base64 = await geminiService.generateColoringPage(
                    structure.pages[i].imagePrompt,
                    structure.characterDescription,
                    charRefBase64 || null
                );
                const imageUrl = await supabaseService.uploadImage(user.id, story.id, i + 1, base64);
                const newPage: StoryPage = {
                    pageNumber: i + 1,
                    text: structure.pages[i].text,
                    imagePrompt: structure.pages[i].imagePrompt,
                    imageUrl: imageUrl
                };
                await supabaseService.addPage(story.id, newPage);

                // Update Local State Progress & Pages
                setStories(prev => prev.map(s => {
                    if (s.id === story.id) {
                        const updatedPages = [...s.pages];
                        updatedPages[i] = newPage;
                        return {
                            ...s,
                            pages: updatedPages,
                            progress: 20 + Math.floor(((i + 1) / structure.pages.length) * 80)
                        };
                    }
                    return s;
                }));
            }

            // COMPLETION GUARD: Only mark as completed if we have all pages
            const expectedPages = story.pageCount || structure.pages.length;
            const actualPages = structure.pages.length;

            if (actualPages === expectedPages) {
                await supabaseService.updateBookStatus(story.id, 'completed', true);
            } else {
                console.warn(`⚠️ Book ${story.id} incomplete: ${actualPages}/${expectedPages} pages. Marking as failed.`);
                await supabaseService.updateBookStatus(story.id, 'failed');
            }

            const refreshed = await supabaseService.getUserStories(user.id);
            setStories(refreshed);
        } catch (error: any) {
            console.error("Background Gen Failed:", error);
            const isQuota = error.message?.includes("magic limit") || error.message?.includes("429");

            await supabaseService.updateBookStatus(story.id, 'failed');
            // Update local state if this is the active story
            setActiveStory(prev => prev && prev.id === story.id ? { ...prev, status: 'failed' } : prev);

            if (isQuota) {
                // If it's a quota error, we might want to alert if it's the active story
                if (activeStory?.id === story.id) {
                    alert("🌟 Our magic is taking a quick break! We've hit our daily magic limit. Please try again in a few hours.");
                }
            }

            // Auto-refresh library to show updated status
            try {
                const refreshed = await supabaseService.getUserStories(user.id);
                setStories(refreshed);
                console.log("✅ Library auto-refreshed after background generation failure");
            } catch (refreshError) {
                console.error("❌ Failed to auto-refresh library:", refreshError);
            }
        } finally {
            processingQueue.current.delete(story.id);
        }
    };

    const generateStory = async (input: UserInput, existingBookId?: string) => {
        if (!user) return;
        setIsGenerating(true);
        setGenerationProgress({ currentStep: 'Consulting the Magic Library', progress: 5 });

        let bookId = existingBookId || '';

        try {
            // Use existing ID if we pre-created the shell, otherwise create new
            if (!bookId) {
                bookId = await supabaseService.createBook(user.id, input, `${input.childName}'s Adventure`);
            }

            setGenerationProgress({ currentStep: 'Weaving the Tale', progress: 15 });
            const structure = await geminiService.generateStoryStructure(
                input.childName,
                input.childAge,
                input.childGender,
                input.category,
                input.prompt,
                input.characterDescription,
                input.pageCount
            );

            const initialStory: Story = {
                ...structure,
                id: bookId,
                status: 'generating',
                pages: structure.pages.map(p => ({ ...p, imageUrl: '' }))
            };
            setActiveStory(initialStory);
            setStories(prev => [initialStory, ...prev]);

            setGenerationProgress({ currentStep: 'Sketching the Master Reference', progress: 25 });
            const charRefBase64 = await geminiService.generateCharacterReference(
                input.childName,
                input.childAge,
                input.characterDescription,
                structure.characterDescription
            );

            let characterReferenceUrl = '';
            if (charRefBase64) {
                try {
                    characterReferenceUrl = await supabaseService.uploadImage(user.id, bookId, 'master_reference', charRefBase64);
                    await supabaseService.updateBookReference(bookId, characterReferenceUrl, structure.characterDescription);

                    // Update local active story immediately with the description
                    setActiveStory(prev => prev ? { ...prev, characterDescription: structure.characterDescription } : null);
                } catch (e) {
                    console.error("Failed to upload reference:", e);
                }
            }

            for (let i = 0; i < structure.pages.length; i++) {
                setGenerationProgress({
                    currentStep: `Sketching Magical Scene ${i + 1}`,
                    progress: 30 + Math.floor(((i + 1) / structure.pages.length) * 65)
                });

                // Pass the Cast Bible Reference to the page generator
                const base64 = await geminiService.generateColoringPage(
                    structure.pages[i].imagePrompt,
                    structure.characterDescription,
                    charRefBase64 || null
                );

                const imageUrl = await supabaseService.uploadImage(user.id, bookId, i + 1, base64);
                const newPage: StoryPage = {
                    pageNumber: i + 1,
                    text: structure.pages[i].text,
                    imagePrompt: structure.pages[i].imagePrompt,
                    imageUrl: imageUrl
                };
                await supabaseService.addPage(bookId, newPage);

                setActiveStory(prev => {
                    if (!prev) return null;
                    const updatedPages = [...prev.pages];
                    updatedPages[i] = newPage;
                    return { ...prev, pages: updatedPages };
                });

                // Update separate stories list as well for Library view
                setStories(prev => prev.map(s => {
                    if (s.id === bookId) {
                        const updatedPages = [...s.pages];
                        updatedPages[i] = newPage;
                        return {
                            ...s,
                            pages: updatedPages,
                            progress: 30 + Math.floor(((i + 1) / structure.pages.length) * 65)
                        };
                    }
                    return s;
                }));
            }

            // COMPLETION GUARD: Verify we have all expected pages before marking complete
            const expectedPages = input.pageCount;
            const actualPages = structure.pages.length;

            if (actualPages === expectedPages) {
                await supabaseService.updateBookStatus(bookId, 'completed', input.pageCount === 5);
            } else {
                console.warn(`⚠️ Book ${bookId} incomplete: ${actualPages}/${expectedPages} pages. Marking as failed.`);
                await supabaseService.updateBookStatus(bookId, 'failed');
            }

            if (input.pageCount === 5) await supabaseService.recordSampleUsed(user.id);

            const updated = await supabaseService.getUserStories(user.id);
            setStories(updated);
            const finalStory = updated.find(s => s.id === bookId);
            if (finalStory) setActiveStory(finalStory);

        } catch (error: any) {
            console.error("Manual Gen Failed:", error);
            const isQuota = error.message?.includes("magic limit") || error.message?.includes("429");

            if (isQuota) {
                alert("🌟 Our magic is taking a quick break! We've hit our daily magic limit for image creation. Please try again in a few hours!");
            } else {
                alert("Magic fizzled out: " + (error as Error).message);
            }

            // Mark as failed in DB using the captured bookId for reliability
            if (bookId) {
                await supabaseService.updateBookStatus(bookId, 'failed');
                // Also update local state so UI doesn't show 'generating' ghost version
                setActiveStory(prev => prev && prev.id === bookId ? { ...prev, status: 'failed' } : prev);
            }

            // Auto-refresh library to show updated status
            try {
                const refreshed = await supabaseService.getUserStories(user.id);
                setStories(refreshed);
                console.log("✅ Library auto-refreshed after manual generation failure");
            } catch (refreshError) {
                console.error("❌ Failed to auto-refresh library:", refreshError);
            }
        } finally {
            setIsGenerating(false);
            setGenerationProgress(null);
        }
    };

    const deleteStory = async (id: string) => {
        await supabaseService.deleteBook(id);
        setStories(prev => prev.filter(s => s.id !== id));
        if (activeStory?.id === id) setActiveStory(null);
    };

    const regenerateStory = async (story: Story) => {
        if (!user) return;

        // 1. Determine Logic Path (Transparency First)
        let needsDeduction = false;

        if (!story.hasBeenRegenerated) {
            // First ever redo is always free (for both paid and samples)
            console.log("🪄 Using free magic redo pass...");
            await supabaseService.setRegenerated(story.id);
            needsDeduction = false;
        } else {
            // It has been regenerated before
            if (story.isPurchased) {
                // Paid books cost 1 credit for subsequent regens
                console.log("💎 Subsequent paid redo: deducting 1 credit...");
                // needsDeduction = true; // Removed
            } else {
                // Samples and paid books both limited to 1 redo for now (Transparency First)
                alert("Each magic tale comes with exactly one creative redo. Time to weave a new adventure!");
                return;
            }
        }

        // 2. State Set
        setStories(prev => prev.map(s => s.id === story.id ? { ...s, status: 'generating', progress: 5 } : s));

        try {
            // if (needsDeduction) { // Removed
            //     await supabaseService.deductCredit(user.id); // Removed
            // } // Removed

            await supabaseService.deletePages(story.id);
            await supabaseService.updateBookStatus(story.id, 'generating');

            // 3. Trigger Generation (Always free redo, no refund needed)
            processBackgroundStory(story, false);
        } catch (err: any) {
            console.error("Regenerate initiation failed:", err);
            alert("Magic misfired: " + err.message);
            // Restore state
            const refreshed = await supabaseService.getUserStories(user.id);
            setStories(refreshed);
        }
    };

    const saveColoringPage = async (bookId: string, pageIndex: number, dataUrl: string) => {
        if (!user) return;
        const story = stories.find(s => s.id === bookId);
        if (!story) return;

        const pageNum = story.pages[pageIndex].pageNumber;
        const rawUrl = await supabaseService.uploadImage(user.id, bookId, pageNum, dataUrl, true);
        const coloredUrl = `${rawUrl}?t=${Date.now()}`;

        await supabaseService.updatePageColor(bookId, pageNum, rawUrl);

        // Update Local State
        const updateStory = (s: Story) => ({
            ...s,
            coverImage: pageNum === 1 ? coloredUrl : s.coverImage,
            pages: s.pages.map(p => p.pageNumber === pageNum ? { ...p, coloredImageUrl: coloredUrl } : p)
        });

        setStories(prev => prev.map(s => s.id === bookId ? updateStory(s) : s));
        if (activeStory?.id === bookId) setActiveStory(prev => prev ? updateStory(prev) : null);
    };

    return (
        <StoryContext.Provider value={{
            stories, activeStory, setActiveStory,
            generateStory, generationProgress, isGenerating,
            deleteStory, regenerateStory, saveColoringPage,
            hydrateStory, loadMore, hasMore,
            isInitialLoading
        }}>
            {children}
        </StoryContext.Provider>
    );
};

export const useStory = () => {
    const context = useContext(StoryContext);
    if (!context) throw new Error("useStory must be used within a StoryProvider");
    return context;
};
