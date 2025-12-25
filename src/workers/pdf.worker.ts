
import { jsPDF } from 'jspdf';
import { Story, UserInput } from '../../types';
import 'svg2pdf.js';

// Define the shape of messages this worker receives
interface PDFWorkerMessage {
    type: 'GENERATE';
    story: Story;
    userInput: UserInput;
}

// Define the messages this worker sends back
type WorkerResponse =
    | { type: 'progress'; value: number; message: string }
    | { type: 'done'; blob: Blob }
    | { type: 'error'; error: string };

const ctx = self as any;

// Helper to fetch and convert image to ImageData for vectorizer
// We likely need to duplicate logic or import the vectorizer worker? 
// Nested workers are possible but can be complex. 
// A better approach for the *PDF Worker* might be to handle the *assembly* 
// and potentially run the vectorization calculations here if we move the logic 
// from vectorizer.worker.ts into a shared utility or just duplicate the math.
// 
// HOWEVER: The mandate is "Zero-Freeze". 
// A simple way: The PDF Worker *is* the one running the vectorization logic 
// sequentially for each page. We can import the logic if we extract it, 
// or we can keep it simple and just do the heavy lifting here.
// Let's implement the vectorization logic directly here to avoid nested worker complexity.

/* --- VECTORIZATION LOGIC (Ported from vectorizer.worker.ts) --- */
import ImageTracer from 'imagetracerjs';

const vectorizeImage = async (imageUrl: string, scale: number = 2.0): Promise<Element | null> => {
    try {
        // 1. Fetch
        const response = await fetch(imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now());
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        // 2. Upscale & Threshold (Using OffscreenCanvas)
        const width = bitmap.width;
        const height = bitmap.height;
        const newWidth = width * scale;
        const newHeight = height * scale;

        const offscreen = new OffscreenCanvas(newWidth, newHeight);
        const ctx2d = offscreen.getContext('2d');
        if (!ctx2d) return null;

        // Draw scaled
        ctx2d.imageSmoothingEnabled = false;
        ctx2d.drawImage(bitmap, 0, 0, newWidth, newHeight);
        const processedData = ctx2d.getImageData(0, 0, newWidth, newHeight);

        // Adaptive Threshold
        const data = processedData.data;
        const threshold = 200;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (data[i + 3] < 10) {
                // Transparent -> White (ignore)
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 0;
            } else if (avg > threshold) {
                // White
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
            } else {
                // Black
                data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
            }
        }

        // 3. Trace to SVG
        const tracerOptions = {
            corsenabled: false,
            ltres: 0.1,
            qtres: 0.1,
            pathomit: 8,
            colorsampling: 0,
            pal: [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
            linefilter: true,
            scale: 1,
            strokewidth: 0,
            viewbox: true,
            desc: false,
        };
        const svgString = ImageTracer.imagedataToSVG(processedData, tracerOptions);

        // 4. Parse to Element (Worker supports DOMParser for XML/SVG)
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        return svgDoc.documentElement;

    } catch (err) {
        console.error("Vectorization failed in worker", err);
        return null;
    }
};


ctx.onmessage = async (e: MessageEvent<PDFWorkerMessage>) => {
    if (e.data.type === 'GENERATE') {
        const { story, userInput } = e.data;
        const TRIM_WIDTH = 8.5;
        const TRIM_HEIGHT = 11.0;
        const INTERIOR_BLEED = 0.125;
        const pdfWidth = TRIM_WIDTH + (INTERIOR_BLEED * 2);
        const pdfHeight = TRIM_HEIGHT + (INTERIOR_BLEED * 2);
        const centerX = pdfWidth / 2;
        const safePrintWidth = TRIM_WIDTH - (0.5 * 2);

        try {
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'in',
                format: [pdfWidth, pdfHeight]
            });

            // Metadata
            doc.setProperties({
                title: story.title,
                subject: `A ChildTale Story for ${userInput.childName}`,
                author: story.authorName || userInput.childName,
                keywords: 'children, book, vector, 300dpi, print-ready',
                creator: 'ChildTale Magic Studio (Infinite Resolution Engine)'
            });

            // --- 1. TITLE PAGE ---
            ctx.postMessage({ type: 'progress', value: 5, message: 'Creating Title Page...' });
            doc.setFont("helvetica", "bold");
            doc.setFontSize(32);
            doc.setTextColor(0, 0, 0);
            const fullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
            const titleLines = doc.splitTextToSize(fullTitle, safePrintWidth);
            doc.text(titleLines, centerX, pdfHeight / 2 - 2, { align: "center" });

            doc.setFontSize(18);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            doc.text(`By ${story.authorName || `A Story for ${userInput.childName}`}`, centerX, pdfHeight / 2 - 1.5, { align: "center" });

            // --- 2. COPYRIGHT PAGE ---
            doc.addPage([pdfWidth, pdfHeight]);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("Infinite Resolution Edition", centerX, 2.0, { align: "center" });
            doc.text("Printed with ChildTale Vector Technology", centerX, 2.3, { align: "center" });

            // --- 3. STORY PAGES ---
            const totalPages = story.pages.length;
            for (let i = 0; i < totalPages; i++) {
                const progress = 10 + Math.round(((i + 1) / totalPages) * 85);
                ctx.postMessage({ type: 'progress', value: progress, message: `Vectorizing Page ${i + 1} of ${totalPages}...` });

                doc.addPage([pdfWidth, pdfHeight]);
                const page = story.pages[i];
                const imageUrl = page.coloredImageUrl || page.imageUrl;

                if (imageUrl) {
                    const svgElem = await vectorizeImage(imageUrl);

                    if (svgElem) {
                        const imgW = safePrintWidth;
                        const imgH = safePrintWidth;
                        const imgX = (pdfWidth - imgW) / 2;
                        const imgY = 1.0 + INTERIOR_BLEED;

                        await doc.svg(svgElem, {
                            x: imgX,
                            y: imgY,
                            width: imgW,
                            height: imgH
                        });

                        // Add Frame
                        doc.setLineWidth(0.01);
                        doc.setDrawColor(0, 0, 0);
                        doc.rect(imgX, imgY, imgW, imgH);
                    }
                }

                // Text
                const textY = 1.0 + INTERIOR_BLEED + safePrintWidth + 0.5;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                const splitText = doc.splitTextToSize(page.text, safePrintWidth);
                doc.text(splitText, centerX, textY, { align: "center", lineHeightFactor: 1.4 });

                // Page Num
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(150, 150, 150);
                doc.text(`${i + 3}`, pdfWidth - 0.5, pdfHeight - 0.5, { align: "right" });
            }

            ctx.postMessage({ type: 'progress', value: 99, message: 'Finalizing PDF...' });
            const blob = doc.output('blob');
            ctx.postMessage({ type: 'done', blob });

        } catch (err: any) {
            console.error("PDF Worker Error:", err);
            ctx.postMessage({ type: 'error', error: err.message || 'Unknown PDF Worker Error' });
        }
    }
};
