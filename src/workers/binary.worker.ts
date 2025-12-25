
// Binary Data Worker
// Handles expensive Base64 <-> Blob conversions off the main thread.

const ctx = self as any;

interface BinaryRequest {
    id: string;
    action: 'base64ToBlob';
    data: string; // Base64 string
    contentType?: string;
}

interface BinaryResponse {
    id: string;
    blob?: Blob;
    error?: string;
}

ctx.onmessage = async (e: MessageEvent<BinaryRequest>) => {
    const { id, action, data, contentType = 'image/png' } = e.data;

    try {
        if (action === 'base64ToBlob') {
            const base64Data = data.includes(',') ? data.split(',')[1] : data;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });

            ctx.postMessage({ id, blob });
        } else {
            throw new Error("Unknown action");
        }
    } catch (error: any) {
        ctx.postMessage({ id, error: error.message });
    }
};

export { };
