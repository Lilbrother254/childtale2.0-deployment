
// Image Compression Web Worker
// Handles resizing of images using OffscreenCanvas to prevent main thread jank.

const ctx = self as any;

interface CompressionRequest {
    id: string;
    fileOrUrl: Blob | string; // Can be a Blob (File) or a Data URL / Object URL
    maxWidth: number;
    maxHeight: number;
    quality?: number; // 0.1 to 1.0 (default 0.8)
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

interface CompressionResponse {
    id: string;
    blob?: Blob;
    base64?: string;
    error?: string;
}

ctx.onmessage = async (e: MessageEvent<CompressionRequest>) => {
    const { id, fileOrUrl, maxWidth, maxHeight, quality = 0.8, outputFormat = 'image/jpeg' } = e.data;

    try {
        let bitmap: ImageBitmap;

        if (typeof fileOrUrl === 'string') {
            // If it's a URL (blob: or data:), fetch it first
            const response = await fetch(fileOrUrl);
            const blob = await response.blob();
            bitmap = await createImageBitmap(blob);
        } else {
            // It's already a Blob/File
            bitmap = await createImageBitmap(fileOrUrl);
        }

        // Calculate aspect ratio
        let width = bitmap.width;
        let height = bitmap.height;

        if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
        }

        // Draw to OffscreenCanvas
        const canvas = new OffscreenCanvas(width, height);
        const ossCtx = canvas.getContext('2d');
        if (!ossCtx) throw new Error("Could not get OffscreenCanvas context");

        ossCtx.drawImage(bitmap, 0, 0, width, height);

        // Convert to Blob
        const blob = await canvas.convertToBlob({ type: outputFormat, quality });

        // Convert to Base64 for compatibility with existing services that need strings
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            ctx.postMessage({ id, blob, base64 } as CompressionResponse);
        };
        reader.onerror = () => {
            throw new Error("Failed to convert blob to base64");
        };
        reader.readAsDataURL(blob);

    } catch (error: any) {
        console.error("Compression Worker Error:", error);
        ctx.postMessage({ id, error: error.message } as CompressionResponse);
    }
};

export { };
