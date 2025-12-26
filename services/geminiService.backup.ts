
import { supabase } from "../utils/supabaseClient";
import { Story, UserInput } from "../types";

// Removed local API key logic //

import CompressionWorker from '../src/workers/compression.worker?worker';

const resizeBase64 = async (base64: string, maxDim: number = 384): Promise<string> => {
  if (!base64) return "";
  return new Promise((resolve) => {
    const worker = new CompressionWorker();
    const id = Math.random().toString(36).substring(7);

    worker.onmessage = (e) => {
      if (e.data.id === id) {
        if (e.data.error) {
          console.warn("Worker compression failed, returning original:", e.data.error);
          resolve(base64); // Fallback
        } else {
          resolve(e.data.base64);
        }
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error("Worker Error:", err);
      resolve(base64); // Fallback
      worker.terminate();
    };

    // Determine target W/H (simplistic logic: assume square maxDim for both for now, worker handles aspect ratio)
    // Actually, worker takes maxW/maxH. We pass maxDim to both.
    worker.postMessage({
      id,
      fileOrUrl: base64,
      maxWidth: maxDim,
      maxHeight: maxDim,
      quality: 0.8,
      outputFormat: 'image/png'
    });
  });
};

export const generateStoryStructure = async (input: UserInput): Promise<Story> => {
  console.group("✨ Gemini: Story Architecting");
  console.log("Request Payload:", input);

  const characterFullDesc = `${input.childAge} year old ${input.childGender}, ${input.characterDescription}`;

  const systemPrompt = `
You are a Lead Storyboard Director for a major animation studio (Pixar/Disney style). 
Structure this story into EXACTLY ${input.pageCount} beats.

**STRICT B&W PROTOCOL (CRITICAL):**
1. **ANTI-SILHOUETTE:** Forcing white interiors so they can be colored. Every object must be drawable as a white shape with a black outline.
2. **NO FILLS:** Specifically forbid using solid black or grey shading. 
3. **ARCHITECTURAL WHIMSY:** Command a Pixar-style aesthetic rather than flat geometric shapes. Houses should be whimsical, cozy, and detailed Pixar-style (think shingles, window panes, flower boxes).
4. **NO COLORS IN PROMPTS:** Do NOT use color adjectives (blue, red, green, etc.). Describe patterns or textures instead.
5. **ASSET FIDELITY:** Describe vehicles and characters by physical features ONLY.
6. **SPATIAL LAYOUT:** Specify where characters stand (Left/Right/Center) to avoid AI duplication.

**OUTPUT:** JSON format containing 'title', 'castBible', and 'pages'.
'castBible' MUST be a visual description of characters using ONLY patterns and shapes (no colors).
`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'generate-story',
        payload: {
          systemPrompt: systemPrompt,
          userPrompt: `Prompt: ${input.prompt}\nProtagonist: ${input.childName}, ${characterFullDesc}`
        }
      }
    });

    if (error) {
      console.error("❌ EDGE FUNCTION ERROR:", error);
      throw error;
    }

    if (data.error) {
      const isQuota = data.code === 429 || data.error.includes("magic limit");
      console.error(`❌ GEMINI API ERROR (Architecture)${isQuota ? " [QUOTA]" : ""}:`, data.error);
      throw new Error(data.error);
    }

    let text = data.text || "{}";
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    const json = JSON.parse(text);

    console.log("✅ Architecture Complete:", json.title);
    console.groupEnd();

    return {
      id: crypto.randomUUID(),
      createdAt: Date.now().toString(),
      category: input.category,
      title: json.title || "Untitled Story",
      characterDescription: json.castBible,
      childName: input.childName,
      childAge: input.childAge,
      childGender: input.childGender,
      pages: (json.pages || []).map((p: any, idx: number) => ({
        pageNumber: idx + 1,
        text: p.text || "",
        imagePrompt: p.imagePrompt || ""
      })),
      status: 'completed',
      isPurchased: false,
      hasBeenRegenerated: false,
      pageCount: input.pageCount
    } as Story;
  } catch (error: any) {
    console.error("❌ Story structure generation failed:", error);
    console.groupEnd();
    throw error;
  }
};

export const generateCharacterReference = async (
  name: string, age: number, description: string, castBible: string
): Promise<string | undefined> => {
  console.group("🎨 Gemini: Character Consistency (Cast Bible)");
  console.log("Target:", name, age, description);

  const prompt = `
    CREATE A MASTER REFERENCE SHEET (12-PANEL GRID).
    STYLE: Professional Coloring Book Model Sheet. 
    
    STRICT B&W PROTOCOL:
    - ANTI-SILHOUETTE: Forcing white interiors so they can be colored.
    - NO FILLS: Specifically forbidding solid black or grey shading.
    - ARCHITECTURAL WHIMSY: Pixar-style aesthetic.
    - 100% BLACK AND WHITE LINE ART ONLY. 
    - NO SILHOUETTES.
    - EVERY SHAPE (CAR, HOUSE, PERSON) MUST BE WHITE INSIDE.
    - Clean, bold black ink outlines on a pure white background.
    
    GRID LAYOUT (4x3):
    ROW 1 (HERO: ${name}): 4 panels showing front, side, happy, and running.
    ROW 2 (SUPPORTING): 4 panels for Mom, Dad, Pets. Adults must be 2x height of child.
    ROW 3 (ASSETS): Line-art drawings of vehicles and cozy, whimsical houses mentioned in Bible: ${castBible}.
  `;

  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'generate-image',
        payload: {
          prompts: prompt,
          model: 'gemini-2.5-flash-image'
        }
      }
    });

    if (error) {
      console.error("❌ EDGE FUNCTION ERROR (Cast Bible):", error);
      throw error;
    }

    if (data.error) {
      const isQuota = data.code === 429 || data.error.includes("magic limit");
      console.error(`❌ GEMINI API ERROR (Cast Bible)${isQuota ? " [QUOTA]" : ""}:`, data.error);
      throw new Error(data.error);
    }

    if (!data.image) {
      throw new Error("Character reference generation failed: No image received.");
    }

    console.log("✅ Cast Bible Generated");
    const result = await resizeBase64(data.image, 512);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error("❌ Cast Bible generation error:", error);
    console.groupEnd();
    throw error;
  }
};

export const generateColoringPage = async (
  imagePrompt: string,
  castContext: string,
  castBibleImageBase64?: string
): Promise<string> => {
  console.group("🖌️ Gemini: Illustration Engine");
  console.log("Prompt:", imagePrompt);

  const finalPrompt = `
    STRICT B&W PROTOCOL:
    - THIS IS A PROFESSIONAL COLORING BOOK PAGE. 
    - ANTI-SILHOUETTE: Forcing white interiors so they can be colored.
    - NO FILLS: Specifically forbidding solid black or grey shading.
    - ARCHITECTURAL WHIMSY: Commanding a Pixar-style aesthetic (whimsical, cozy, detailed).
    - FORBIDDEN: SILHOUETTES, GREYSCALE, COLOR.
    - MANDATORY: EVERY OBJECT (CAR, HOUSE, CHARACTER) MUST BE WHITE INSIDE WITH BOLD BLACK OUTLINES.
    
    SCENE RULES:
    1. HERO COUNT: Draw the hero EXACTLY ONCE.
    2. NO GHOSTS: No extra people or children.
    3. POSITIONING: ${imagePrompt}
    4. STYLE: High-contrast stencil line art. 
    5. CLOSED PATHS: Every line must be perfectly closed for flood filling.
    
    SCENE DESCRIPTION: ${imagePrompt}
    CHARACTER CONTEXT: ${castContext}
  `;

  const payload: any = {
    prompts: [finalPrompt],
    model: 'gemini-2.5-flash-image'
  };

  if (castBibleImageBase64) {
    const resizedRef = await resizeBase64(castBibleImageBase64, 448);
    payload.base64Image = resizedRef;
    payload.prompts.push("Strictly maintain the character and asset designs from the attached reference sheet.");
    console.log("🖼️ Multimedia: Reference image attached.");
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'generate-image',
        payload: payload
      }
    });

    if (error) {
      console.error("❌ EDGE FUNCTION ERROR (Coloring Page):", error);
      throw new Error("Page generation failed.");
    }

    if (data.error) {
      const isQuota = data.code === 429 || data.error.includes("magic limit");
      console.error(`❌ GEMINI API ERROR (Coloring Page)${isQuota ? " [QUOTA]" : ""}:`, data.error);
      throw new Error(data.error);
    }

    if (!data.image) {
      console.error("❌ No image in response");
      throw new Error("Page generation failed.");
    }

    console.log("✅ Illustration Magic Successful");
    console.groupEnd();
    return data.image;
  } catch (error: any) {
    console.error("❌ Generation failed:", error);
    console.groupEnd();
    throw error;
  }
};

export const sendChatMessage = async (
  messages: { role: 'user' | 'assistant', content: string }[],
  systemPrompt: string
): Promise<string> => {
  console.group("🤖 Sparky Support Engine (Gemini 3 Flash)");
  console.log("Last User Message:", messages[messages.length - 1].content);

  const chatPromise = (async () => {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'chat',
        payload: {
          messages,
          systemPrompt
        }
      }
    });

    if (error) {
      console.error("❌ EDGE FUNCTION ERROR (Chat):", error);
      throw error;
    }

    if (data.error) {
      const isQuota = data.code === 429 || data.error.includes("magic limit");
      console.error(`❌ GEMINI API ERROR (Chat)${isQuota ? " [QUOTA]" : ""}:`, data.error);
      throw new Error(data.error);
    }

    return data.text;
  })();

  const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => {
    reject(new Error("Sparky's magic is taking a little longer than usual! ✨ One more try?"));
  }, 12000));

  try {
    const text = await Promise.race([chatPromise, timeoutPromise]);
    console.log("✅ Sparky Responded");
    console.groupEnd();
    return text;
  } catch (error: any) {
    console.error("❌ Chat failed:", error);
    console.groupEnd();
    throw error;
  }
};
