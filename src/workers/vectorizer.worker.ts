
import ImageTracer from 'imagetracerjs';

export interface VectorizerMessage {
    type: 'process';
    imageData: ImageData;
    width: number;
    height: number;
    options?: {
        scale?: number;
        threshold?: number;
    };
}

export interface VectorizerResponse {
    svg: string;
    elapsed: number;
}

const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent<VectorizerMessage>) => {
    const start = performance.now();
    const { imageData, width, height, options } = e.data;

    // 1. UPSCALE & THRESHOLD PIPELINE
    // We use an OffscreenCanvas to perform high-quality scaling if supported
    // Otherwise fallback to simple processing
    let processedData = imageData;

    try {
        const scale = options?.scale || 2.0; // 2x upscale for better tracing
        const newWidth = width * scale;
        const newHeight = height * scale;

        // Create offscreen canvas for resizing
        const offscreen = new OffscreenCanvas(newWidth, newHeight);
        const ctx2d = offscreen.getContext('2d');

        if (ctx2d) {
            // Draw original data to a temp canvas to draw it scaled
            const tempCvs = new OffscreenCanvas(width, height);
            const tempCtx = tempCvs.getContext('2d');
            if (tempCtx) {
                tempCtx.putImageData(imageData, 0, 0);

                // Draw scaled
                ctx2d.imageSmoothingEnabled = false; // Keep edges sharp for vectorizer? Or true for smooth curves?
                // Actually, for vectorization of line art, a little smoothing helps curves, 
                // but we want crisp lines. Let's try smoothing = false for accuracy to the pixel grid 
                // or true to let the browser bicubic filter help us.
                // Let's go with FALSE to prevent fuzzy gray edges that confuse the thresholder.
                ctx2d.imageSmoothingEnabled = false;
                ctx2d.drawImage(tempCvs, 0, 0, newWidth, newHeight);

                // Get scaled data
                processedData = ctx2d.getImageData(0, 0, newWidth, newHeight);
            }
        }

        // 2. ADAPTIVE BINARY THRESHOLDING (The "Dust" Cleaner)
        // Force every pixel to BLACK or WHITE. No gray.
        const data = processedData.data;
        const threshold = options?.threshold || 200; // Brightness cutoff

        for (let i = 0; i < data.length; i += 4) {
            // Simple luminosity
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // If it has ANY alpha, check brightness. If transparent, treat as white.
            if (data[i + 3] < 10) {
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 0; // Transp
            } else if (avg > threshold) {
                // White
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255; // Solid White (or 0 for transparent?)
                // For tracing, usually white background is ignored.
            } else {
                // Black
                data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
            }
        }

        // 3. VECTORIZATION (ImageTracerJS)
        // Options optimized for B&W Line Art
        const tracerOptions = {
            corsenabled: false,
            ltres: 0.1, // Error threshold for straight lines (lower = more detail)
            qtres: 0.1, // Error threshold for quadratic splines
            pathomit: 8, // Ignore very small speckles (approx < 8 pixels)
            colorsampling: 0, // 0 = disabled (only B&W)? No, 0 means random sampling. 
            // Better customized palette for B&W
            pal: [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
            linefilter: true,
            scale: 1, // Already upscaled
            strokewidth: 0, // No stroke, just fills

            // Rendering options
            viewbox: true,
            desc: false,
        };

        const svgString = ImageTracer.imagedataToSVG(processedData, tracerOptions);

        const end = performance.now();
        console.log(`Vectorization complete in ${(end - start).toFixed(2)}ms`);

        ctx.postMessage({ svg: svgString, elapsed: end - start });

    } catch (error) {
        console.error("Worker Vectorization Failed:", error);
        // Fallback: indicate failure or return empty
        ctx.postMessage({ svg: "", elapsed: 0 });
    }
};
