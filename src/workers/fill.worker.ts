
// Flood Fill Web Worker
// Optimized for performance using TypedArrays and unrolled loops to prevent GC pauses.

// Fix TypeScript treating self as Window
const ctx = self as any;

let canvasWidth = 0;
let canvasHeight = 0;
let boundaryMask: Uint8Array | null = null;

ctx.onmessage = function (e: MessageEvent) {
    try {
        const { type } = e.data;

        // --- INITIALIZATION ---
        if (type === 'INIT') {
            const { width, height, maskData } = e.data;
            console.log(`Worker: INIT received. Size: ${width}x${height}`);

            canvasWidth = width;
            canvasHeight = height;

            // maskData comes as an ArrayBuffer from the main thread's ImageData
            const pixels = new Uint8ClampedArray(maskData);

            // Re-allocate validation mask only if necessary
            if (!boundaryMask || boundaryMask.length !== width * height) {
                boundaryMask = new Uint8Array(width * height);
            }

            // Pre-calculate boundary mask
            // 1 = Wall/Boundary, 0 = Fillable
            for (let i = 0; i < width * height; i++) {
                const idx = i * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const a = pixels[idx + 3];

                // Luminance calculation
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                // A pixel is a boundary if it is visible (alpha > 100) and dark (lum < 180)
                boundaryMask[i] = (a > 100 && lum < 180) ? 1 : 0;
            }
            console.log('Worker: INIT completed successfully.');
            return;
        }

        // --- FILL OPERATION ---
        if (type === 'FILL') {
            // console.log('Worker: FILL request received.');
            const { buffer, startX, startY, fillColorHex } = e.data;

            // 1. Validation
            if (!boundaryMask) {
                throw new Error("Worker not initialized with line art mask.");
            }

            // 2. Parse arguments
            const pixels = new Uint8ClampedArray(buffer);
            const fr = parseInt(fillColorHex.slice(1, 3), 16);
            const fg = parseInt(fillColorHex.slice(3, 5), 16);
            const fb = parseInt(fillColorHex.slice(5, 7), 16);

            // Ensure integer coordinates to prevent infinite loops from floating point math
            const x = Math.floor(startX);
            const y = Math.floor(startY);
            const startIdx = y * canvasWidth + x;

            // 3. Early Exit Checks
            // Out of bounds
            if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) {
                console.log('Worker: Skipped - Out of bounds coords:', x, y);
                ctx.postMessage({ buffer, changed: false }, [buffer]);
                return;
            }

            // Clicked on a wall
            if (boundaryMask[startIdx] === 1) {
                // console.log('Worker: Skipped - Clicked on boundary line.');
                ctx.postMessage({ buffer, changed: false }, [buffer]);
                return;
            }

            // Clicked on a pixel that is already the target color
            const pIdx = startIdx * 4;
            if (pixels[pIdx] === fr && pixels[pIdx + 1] === fg && pixels[pIdx + 2] === fb && pixels[pIdx + 3] === 255) {
                // console.log('Worker: Skipped - Already filled with this color.');
                ctx.postMessage({ buffer, changed: false }, [buffer]);
                return;
            }

            // 4. BFS Flood Fill Algorithm (Iterative)
            // console.log('Worker: Starting optimized BFS...');
            const qSize = canvasWidth * canvasHeight;
            const queue = new Int32Array(qSize); // Zero-allocation queue
            const visited = new Uint8Array(qSize); // Zero-allocation visited set

            let head = 0;
            let tail = 0;

            // Push start node
            queue[tail++] = startIdx;
            visited[startIdx] = 1;

            while (head < tail) {
                const currIdx = queue[head++];

                // Color the pixel
                const px = currIdx * 4;
                pixels[px] = fr;
                pixels[px + 1] = fg;
                pixels[px + 2] = fb;
                pixels[px + 3] = 255; // Force opacity

                const cx = currIdx % canvasWidth;
                const cy = (currIdx / canvasWidth) | 0;

                // Check Neighbors (Up, Down, Left, Right)
                // Unrolled for performance

                // Left
                if (cx > 0) {
                    const n = currIdx - 1;
                    if (visited[n] === 0 && boundaryMask[n] === 0) {
                        visited[n] = 1;
                        queue[tail++] = n;
                    }
                }
                // Right
                if (cx < canvasWidth - 1) {
                    const n = currIdx + 1;
                    if (visited[n] === 0 && boundaryMask[n] === 0) {
                        visited[n] = 1;
                        queue[tail++] = n;
                    }
                }
                // Up
                if (cy > 0) {
                    const n = currIdx - canvasWidth;
                    if (visited[n] === 0 && boundaryMask[n] === 0) {
                        visited[n] = 1;
                        queue[tail++] = n;
                    }
                }
                // Down
                if (cy < canvasHeight - 1) {
                    const n = currIdx + canvasWidth;
                    if (visited[n] === 0 && boundaryMask[n] === 0) {
                        visited[n] = 1;
                        queue[tail++] = n;
                    }
                }
            }

            // console.log(`Worker: Finished. Filled ${tail} pixels.`);

            // 5. Return result
            // Transfer buffer back to main thread
            ctx.postMessage({ buffer, changed: true }, [buffer]);
        }
    } catch (err: any) {
        console.error('Worker Error:', err);
        ctx.postMessage({ error: err.message });
    }
};

export { };
