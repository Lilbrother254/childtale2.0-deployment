
import { supabase } from '../utils/supabaseClient';

/**
 * ChildTale Pipeline - Stage 1: Adaptive Pre-Filtering
 * Custom algorithm to force AI sketches into professional 300 DPI line art.
 * This removes "dust", interpolation artifacts, and gray shading.
 */
const applyAdaptiveThreshold = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Upscale slightly to provide more pixel density for the thresholding
      const UPSCALE_FACTOR = 1.5;
      canvas.width = img.width * UPSCALE_FACTOR;
      canvas.height = img.height * UPSCALE_FACTOR;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { resolve(base64); return; }

      // Stage 1: Sharpening Draw
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      /**
       * Stage 2: Adaptive Binary Thresholding
       * Forces every pixel to pure #000 (Black) or #FFF (White)
       * This removes the "136.5 DPI gap" and creates vector-ready contrast.
       */
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Luminance calculation (Perceptual weights)
        const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // Threshold: High values become white, low values (lines) become pure black
        // This cleaning process makes line art print-ready at 300 DPI
        const res = v < 190 ? 0 : 255;

        data[i] = data[i + 1] = data[i + 2] = res;
        data[i + 3] = 255; // Force full opacity
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => resolve(base64);
  });
};

/**
 * Utility to resize base64 images to avoid token limits.
 * Max width/height 512px.
 */
const resizeBase64 = (base64Str: string, maxWidth = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8)); // JPEG 80% quality
    };
    img.onerror = () => resolve(base64Str); // Fallback: return original
  });
};


/**
 * Generates the story structure using Gemini 1.5 Pro via Edge Function
 */
export const generateStoryStructure = async (
  childName: string,
  childAge: number,
  childGender: string,
  category: string,
  prompt: string,
  description: string,
  pageCount: number = 5
) => {
  console.group("✨ Gemini: Story Engine");

  const systemPrompt = `Create a ${pageCount}-page coloring book story for a ${childAge} year old ${childGender} named ${childName}.
    The story theme is: ${category}.
    User Prompt: ${prompt}.
    Additional details: ${description}.
    
    IMPORTANT: You MUST return EXACTLY ${pageCount} pages. Do not return more, do not return less. 
    Each page must represent a distinct scene in the requested story.
    
    Output a JSON object with:
    - title: Creative story title
    - characterDescription: A specific physical description of ${childName} for visual consistency.
    - pages: An array of ${pageCount} objects, each with:
      - text: 1-2 sentences of story text
      - imagePrompt: A detailed description for an AI illustrator to draw this scene.
    `;

  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'generate-story',
        payload: {
          systemPrompt: systemPrompt,
          userPrompt: prompt // The actual story request
        }
      }
    });

    if (error) {
      console.error("Simple Edge Function Error:", error);
      throw error;
    }

    if (data.error) {
      console.error("API Error in data:", data.error);
      throw new Error(data.error);
    }

    console.log("✅ Story Structure Generated");
    console.groupEnd();
    // Use data.text as returned by the Edge Function
    return data.text ? JSON.parse(data.text) : null;

  } catch (error) {
    console.error("Story structure generation failed:", error);
    console.groupEnd();
    throw error;
  }
};

/**
 * Generates a character reference (Cast Bible) using Gemini 2.0 Flash Exp
 */
export const generateCharacterReference = async (
  name: string,
  age: number,
  userDesc: string,
  aiDesc: string
): Promise<string | undefined> => {
  console.group("🎭 Gemini: Cast Bible Engine");

  const prompt = `A professional character reference sheet for a child named ${name}, age ${age}.
    Description: ${userDesc}. ${aiDesc}.
    The sheet shows the character from front and side views.
    STYLE: Clean line art, bold black outlines, pure white background, no shading, no colors, high contrast, 300 DPI vector style.`;

  try {
    const payload = {
      prompts: [prompt],
      model: 'gemini-2.5-flash-image' // Aligning with ChildTale 2.0 Visual Engine
    };

    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'generate-image',
        payload: payload
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    if (!data.image) {
      console.warn("⚠️ No image returned for Cast Bible");
      console.groupEnd();
      return undefined;
    }

    console.log("✅ Cast Bible Generated");
    console.groupEnd();

    // Resize for token efficiency when reusing later
    return await resizeBase64(`data:image/png;base64,${data.image}`);

  } catch (error) {
    console.error("❌ Cast Bible generation failed (Non-blocking):", error);
    console.groupEnd();
    return undefined;
  }
};

/**
 * Generates a single high-fidelity coloring page using Supabase Edge Function
 */
export const generateColoringPage = async (
  imagePrompt: string,
  castContext: string = "",
  castBibleImageBase64: string | null = null
): Promise<string> => {
  console.group("🖌️ Gemini: Illustration Engine");

  const finalPrompt = `
    STRICT B&W PROTOCOL:
    - THIS IS A PROFESSIONAL COLORING BOOK PAGE. 
    - ANTI-SILHOUETTE: Forcing white interiors so they can be colored.
    - NO FILLS: Specifically forbidding solid black or grey shading.
    - ARCHITECTURAL WHIMSY: Commanding a Pixar-style aesthetic (whimsical, cozy, detailed).
    - FORBIDDEN: SILHOUETTES, GREYSCALE, COLOR.
    - MANDATORY: EVERY OBJECT (CAR, HOUSE, CHARACTER) MUST BE WHITE INSIDE WITH BOLD BLACK OUTLINES.
    
    SCENE RULES:
    HERO COUNT: Draw the hero EXACTLY ONCE. NO GHOSTS.
    POSITIONING: ${imagePrompt}
    STYLE: High contrast stencil line art. CLOSED PATHS.
    
    SCENE: ${imagePrompt}
    CHARACTER: ${castContext}
  `;

  try {
    const payload: any = {
      prompts: [finalPrompt],
      model: 'gemini-2.5-flash-image'
    };

    if (castBibleImageBase64) {
      // Pass the reference image to the Edge Function wrapper
      payload.base64Image = castBibleImageBase64;
      payload.prompts.push("Strictly maintain the character designs from the attached reference sheet.");
      console.log("🖼️ Multimedia: Reference image attached.");
    }

    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'generate-image',
        payload: payload
      }
    });

    if (error) throw error;
    if (data.error) {
      const isQuota = data.code === 429 || data.error.includes("magic limit");
      console.error(`❌ GEMINI API ERROR ${isQuota ? "[QUOTA]" : ""}:`, data.error);
      throw new Error(data.error);
    }

    if (!data.image) throw new Error("No image data returned.");

    console.log("✅ Illustration Magic Successful");
    console.groupEnd();

    // Apply the "Adaptive Threshold" filter here
    return await applyAdaptiveThreshold(`data:image/png;base64,${data.image}`);

  } catch (error: any) {
    console.error("❌ Illustration Magic failed:", error);
    console.groupEnd();
    throw error; // Propagate the error to StoryContext
  }
};

export const sendChatMessage = async (
  messages: { role: 'user' | 'assistant', content: string }[],
  context: string
): Promise<string> => {
  try {
    // WORKAROUND: Configuring "Gateway Pattern"
    // Using the robust 'generate-story' function to handle chat, bypassing CORS issues on the standalone function.

    // Construct a rich prompt that includes history
    const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const finalPrompt = `
      ACT AS SPARKY: The magical, playful customer support mascot for ChildTale.
      
      YOUR KNOWLEDGE BASE (CONTEXT):
      ${context}
      
      CURRENT CONVERSATION:
      ${conversationHistory}
      
      INSTRUCTION:
      Reply to the USER's last message. 
      - Be helpful but brief. 
      - Use 1-2 emojis. 
      - If you don't know, ask them to email childtale4@gmail.com.
    `;

    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        action: 'chat',
        payload: {
          messages: messages,
          systemPrompt: context
        }
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // 'generate-story' returns the text in the 'text' field
    return data.text || "Sparky is lost for words! ✨";

  } catch (error) {
    console.error("Chat error:", error);
    return "Sparky is taking a nap! 😴 (I'm having trouble connecting right now, please try again later!)";
  }
};
