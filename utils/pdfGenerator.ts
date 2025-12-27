import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { Story, UserInput, StoryCategory } from "../types";

// --- LULU SPECIFICATIONS (US LETTER 8.5 x 11) ---
// All units in INCHES
const TRIM_WIDTH = 8.5;
const TRIM_HEIGHT = 11.0;
const INTERIOR_BLEED = 0.125;

// Hardcover Casewrap Specifics (Standard Industry estimates, adjustable via Lulu templates)
const COVER_BLEED = 0.125;
const WRAP = 0.75; // Fold over area
const HINGE = 0.4; // Space between spine and rigid board (visual safe zone)

// Paper thickness (Standard 60# or 80# coated)
// 25 pages = ~0.06 inches spine (very thin). Text might not fit on spine.
const PPI = 426; // Pages Per Inch (approx for 60# standard)

const getThemeColor = (category: StoryCategory): [number, number, number] => {
  // Returns RGB tuple for Pastel Colors
  switch (category) {
    case 'DREAM': return [233, 213, 255]; // Pastel Purple (#E9D5FF)
    case 'MILESTONE': return [254, 249, 195]; // Pastel Yellow (#FEF9C3)
    case 'ADVENTURE': return [255, 237, 213]; // Pastel Orange (#FFEDD5)
    case 'MEMORY': return [252, 231, 243]; // Pastel Pink (#FCE7F3)
    case 'IMAGINATION': return [219, 234, 254]; // Pastel Blue (#DBEAFE)
    default: return [241, 245, 249]; // Slate 100
  }
};

const getCategoryLabel = (category: StoryCategory): string => {
  switch (category) {
    case 'DREAM': return "A DREAM STORY";
    case 'MILESTONE': return "A MILESTONE MOMENT";
    case 'ADVENTURE': return "AN ADVENTURE TALE";
    case 'MEMORY': return "A CHERISHED MEMORY";
    case 'IMAGINATION': return "PURE IMAGINATION";
    default: return "A CHILDTALE STORY";
  }
};

/**
 * Helper to fetch image from URL and convert to Base64
 * jsPDF.addImage handles Base64 much more reliably than URLs
 */
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    // Appends a cachebuster to avoid stale CORS issues
    const response = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime(), {
      cache: 'no-store',
      mode: 'cors'
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Base64 conversion failed for:", url, error);
    return "";
  }
};

/**
 * Generates the Interior File for Lulu (or home printing)
 * Specs: 8.5 x 11 Trim, 0.125 Bleed on all sides.
 */
export const createInteriorDoc = async (story: Story, userInput: UserInput) => {

  const pdfWidth = TRIM_WIDTH + (INTERIOR_BLEED * 2);
  const pdfHeight = TRIM_HEIGHT + (INTERIOR_BLEED * 2);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'in',
    format: [pdfWidth, pdfHeight]
  });

  const centerX = pdfWidth / 2;
  const safePrintWidth = TRIM_WIDTH - (0.5 * 2);

  // --- 1. TITLE PAGE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(0, 0, 0);

  const centerY = pdfHeight / 2;

  // Title: Subtitle format
  const fullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
  const titleLines = doc.splitTextToSize(fullTitle, safePrintWidth);
  doc.text(titleLines, centerX, centerY - 2, { align: "center" });

  // Author
  const author = story.authorName || `A Story for ${userInput.childName}`;
  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(author, centerX, centerY - 1.5, { align: "center" });

  if (story.coverImage) {
    try {
      const imgSize = 4;
      const base64Cover = await imageUrlToBase64(story.coverImage);
      if (base64Cover) {
        doc.addImage(base64Cover, 'PNG', centerX - (imgSize / 2), centerY - 0.5, imgSize, imgSize);
      }
    } catch (e) {
      console.error("Cover image error:", e);
    }
  }

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Published by ChildTale", centerX, pdfHeight - 1, { align: "center" });

  // --- 2. COPYRIGHT PAGE ---
  doc.addPage([pdfWidth, pdfHeight]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const copyrightY = 2.0;
  const copyrightYear = story.copyrightYear || new Date().getFullYear().toString();
  const publisherName = story.authorName || userInput.childName || "A ChildTale Creator";

  doc.text(fullTitle, centerX, copyrightY, { align: "center" });
  doc.text(`By ${author}`, centerX, copyrightY + 0.3, { align: "center" });

  let currentY = copyrightY + 1.5;
  doc.text(`Copyright © ${copyrightYear} ${publisherName}. All rights reserved.`, centerX, currentY, { align: "center" });
  currentY += 0.5;
  doc.text(`Published by ${publisherName}`, centerX, currentY, { align: "center" });
  currentY += 0.5;

  if (story.isbn) {
    doc.text(`ISBN ${story.isbn}`, centerX, currentY, { align: "center" });
  } else {
    doc.text(`ISBN: (Pending Distribution)`, centerX, currentY, { align: "center" });
  }

  currentY += 1.0;
  doc.text("Printed in the United States of America / Globally Distributed", centerX, currentY, { align: "center" });

  // --- 3. STORY PAGES ---
  for (let i = 0; i < story.pages.length; i++) {
    doc.addPage([pdfWidth, pdfHeight]);
    const page = story.pages[i];
    const imageToUse = page.coloredImageUrl || page.imageUrl;

    if (imageToUse) {
      try {
        const imgW = safePrintWidth;
        const imgH = safePrintWidth;
        const imgX = (pdfWidth - imgW) / 2;
        const imgY = 1.0 + INTERIOR_BLEED;

        // PRE-FETCH FOR BASE64
        const base64Img = await imageUrlToBase64(imageToUse);
        if (base64Img) {
          doc.addImage(base64Img, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');
        }

        doc.setLineWidth(0.01);
        doc.setDrawColor(0, 0, 0);
        doc.rect(imgX, imgY, imgW, imgH);

        const textY = imgY + imgH + 0.5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);

        const splitText = doc.splitTextToSize(page.text, safePrintWidth);
        doc.text(splitText, centerX, textY, { align: "center", lineHeightFactor: 1.4 });

      } catch (e) {
        console.error(`Page ${i + 1} generation error:`, e);
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const splitText = doc.splitTextToSize(page.text, safePrintWidth);
      doc.text(splitText, centerX, pdfHeight / 2, { align: "center" });
    }

    // Page Number (Bottom Right)
    // Front matter (Title + Copyright) are pages 1 & 2.
    // Story pages start at p3.
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`${i + 3}`, pdfWidth - 0.5, pdfHeight - 0.5, { align: "right" });
  }
  return doc;
};

/**
 * Creates the Cover JS PDF Object (Does not save)
 */
export const createCoverDoc = async (story: Story, userInput: UserInput) => {

  const spineWidth = Math.max(0.25, (story.pageCount || 25) / PPI);
  const singleCoverWidth = TRIM_WIDTH;
  const totalHeight = WRAP + COVER_BLEED + TRIM_HEIGHT + COVER_BLEED + WRAP;
  const totalWidth = (WRAP + COVER_BLEED + singleCoverWidth) * 2 + spineWidth;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'in',
    format: [totalWidth, totalHeight]
  });

  const xBackStart = WRAP + COVER_BLEED;
  const xSpineStart = xBackStart + singleCoverWidth;
  const xFrontStart = xSpineStart + spineWidth;

  const yTrimTop = WRAP + COVER_BLEED;
  const yTrimBottom = yTrimTop + TRIM_HEIGHT;

  const backCenterX = xBackStart + (singleCoverWidth / 2);
  const frontCenterX = xFrontStart + (singleCoverWidth / 2);
  const spineCenterX = xSpineStart + (spineWidth / 2);
  const coverCenterY = totalHeight / 2;

  const themeRgb = getThemeColor(story.category);
  doc.setFillColor(themeRgb[0], themeRgb[1], themeRgb[2]);
  doc.rect(0, 0, totalWidth, totalHeight, 'F');

  // FRONT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(getCategoryLabel(story.category), frontCenterX, yTrimTop + 1.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(0, 0, 0);
  const fullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
  const titleLines = doc.splitTextToSize(fullTitle, singleCoverWidth - 1.5);
  doc.text(titleLines, frontCenterX, yTrimTop + 2.5, { align: "center" });

  const author = story.authorName || "ChildTale";
  doc.setFontSize(14);
  doc.text(`By ${author}`, frontCenterX, yTrimTop + 4.0, { align: "center" });

  const coverImg = story.coverImage;
  if (coverImg) {
    try {
      const imgSize = 5.5;
      const imgY = yTrimTop + 4.5;
      const base64Cover = await imageUrlToBase64(coverImg);

      if (base64Cover) {
        doc.addImage(base64Cover, 'PNG', frontCenterX - (imgSize / 2), imgY, imgSize, imgSize);
        doc.setLineWidth(0.05);
        doc.setDrawColor(255, 255, 255);
        doc.rect(frontCenterX - (imgSize / 2), imgY, imgSize, imgSize);
      }
    } catch (e) { console.error("Cover PDF image error:", e); }
  }

  // SPINE
  // Only include spine text if book has 100 or more pages
  if ((story.pageCount || 25) >= 100) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const spineFullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
    doc.text(spineFullTitle.toUpperCase(), spineCenterX, yTrimTop + 1.5, {
      align: 'right',
      angle: -90
    });
  }

  // BACK
  doc.setFont("helvetica", "italic");
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  const backMsg = [`This book was made specifically for`, `${userInput.childName}`];
  doc.text(backMsg, backCenterX, coverCenterY - 1, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Made with ChildTale", backCenterX, yTrimBottom - 1.5, { align: "center" });

  doc.setFillColor(255, 255, 255);
  doc.circle(backCenterX, yTrimBottom - 2.5, 0.4, 'F');
  doc.setFontSize(8);
  doc.text("CT", backCenterX, yTrimBottom - 2.4, { align: "center" });

  // ISBN Barcode Box (3.625" x 1.25" per new guide template)
  const barcodeW = 3.625;
  const barcodeH = 1.25;
  // Positioned bottom-right of the back cover spread, near the hinge/spine
  // Padding 0.5" from the bottom wrap edge and 0.5" from the spine edge
  const barcodeX = xSpineStart - barcodeW - 0.5;
  const barcodeY = totalHeight - 0.5 - barcodeH;

  doc.setFillColor(255, 255, 255);
  doc.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.01);
  doc.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'S');

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ISBN BARCODE AREA", barcodeX + (barcodeW / 2), barcodeY + (barcodeH / 2) + 0.05, { align: "center" });

  return doc;
};

// --- PUBLIC EXPORTS (BLOB + DOWNLOAD) ---

export const getLuluInteriorBlob = async (story: Story, userInput: UserInput): Promise<Blob> => {
  const doc = await createInteriorDoc(story, userInput);
  return doc.output('blob');
};

export const getLuluCoverBlob = async (story: Story, userInput: UserInput): Promise<Blob> => {
  const doc = await createCoverDoc(story, userInput);
  return doc.output('blob');
};

export const generateLuluInteriorPDF = async (story: Story, userInput: UserInput) => {
  try {
    const doc = await createInteriorDoc(story, userInput);
    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_interior.pdf`;

    // Force strict filename usage via Blob and Anchor
    const blob = doc.output('blob');
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (error: any) {
    console.error("PDF Generation Error", error);
    alert(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
  }
};

export const generateLuluCoverPDF = async (story: Story, userInput: UserInput) => {
  try {
    const doc = await createCoverDoc(story, userInput);
    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_casewrap.pdf`);
  } catch (error: any) {
    console.error("Cover PDF Generation Error", error);
    alert(`Failed to generate Cover PDF: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generates an all-in-one PDF for home printing.
 * Includes Front Cover, Title Page, Copyright, Story, and Back Cover.
 * All pages are standard US Letter (8.5x11) portrait.
 */
export const generateHomePrintPDF = async (story: Story, userInput: UserInput) => {
  try {

    const pdfWidth = TRIM_WIDTH + (INTERIOR_BLEED * 2);
    const pdfHeight = TRIM_HEIGHT + (INTERIOR_BLEED * 2);
    const centerX = pdfWidth / 2;
    const safePrintWidth = TRIM_WIDTH - (0.5 * 2);

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'in',
      format: [pdfWidth, pdfHeight]
    });

    const themeRgb = getThemeColor(story.category);
    const fullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
    const author = story.authorName || "ChildTale";

    // --- 1. FRONT COVER ---
    doc.setFillColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.rect(0, 0, pdfWidth, pdfHeight, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(0, 0, 0);
    const frontTitleLines = doc.splitTextToSize(fullTitle, safePrintWidth);
    doc.text(frontTitleLines, centerX, 3, { align: "center" });

    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`By ${author}`, centerX, 4.5, { align: "center" });

    if (story.coverImage) {
      const base64Cover = await imageUrlToBase64(story.coverImage);
      if (base64Cover) {
        const coverW = 6;
        const coverH = 6;
        doc.addImage(base64Cover, 'PNG', centerX - (coverW / 2), 5.5, coverW, coverH);
      }
    }

    // --- 2. TITLE PAGE & COPYRIGHT & STORY ---
    // We recreate the interior logic here but starting from page 2
    // Title Page (P2)
    doc.addPage([pdfWidth, pdfHeight]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(fullTitle, safePrintWidth);
    doc.text(titleLines, centerX, pdfHeight / 2 - 2, { align: "center" });
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(author, centerX, pdfHeight / 2 - 1.5, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Published by ChildTale", centerX, pdfHeight - 1, { align: "center" });

    // Copyright Page (P3)
    doc.addPage([pdfWidth, pdfHeight]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const copyrightYear = story.copyrightYear || new Date().getFullYear().toString();
    const publisherName = story.authorName || userInput.childName || "A ChildTale Creator";
    doc.text(fullTitle, centerX, 2.0, { align: "center" });
    doc.text(`By ${author}`, centerX, 2.3, { align: "center" });
    let currentY = 3.5;
    doc.text(`Copyright © ${copyrightYear} ${publisherName}. All rights reserved.`, centerX, currentY, { align: "center" });
    currentY += 0.5;
    doc.text(`Published by ${publisherName}`, centerX, currentY, { align: "center" });
    if (story.isbn) {
      currentY += 0.5;
      doc.text(`ISBN ${story.isbn}`, centerX, currentY, { align: "center" });
    }
    currentY += 1.0;
    doc.text("Printed locally for personal use and enjoyment.", centerX, currentY, { align: "center" });

    // Story Pages (P4+)
    for (let i = 0; i < story.pages.length; i++) {
      doc.addPage([pdfWidth, pdfHeight]);
      const page = story.pages[i];
      const imageUrl = page.coloredImageUrl || page.imageUrl;
      if (imageUrl) {
        try {
          const base64 = await imageUrlToBase64(imageUrl);
          const imgW = 7;
          const imgH = 7;
          const imgX = (pdfWidth - imgW) / 2;
          const imgY = 1.0;
          if (base64) {
            doc.addImage(base64, 'PNG', imgX, imgY, imgW, imgH);
          }
          doc.setLineWidth(0.01);
          doc.setDrawColor(0, 0, 0);
          doc.rect(imgX, imgY, imgW, imgH);
          const textY = imgY + imgH + 0.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          const splitText = doc.splitTextToSize(page.text, safePrintWidth);
          doc.text(splitText, centerX, textY, { align: "center", lineHeightFactor: 1.4 });
        } catch (e) {
          console.error(`Page ${i + 1} error:`, e);
        }
      }
      // Home print page numbering starts from Actual PDF index (Cover is 1, Title 2, Copyright 3, so story starts at 4)
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`${i + 4}`, pdfWidth - 0.5, pdfHeight - 0.5, { align: "right" });
    }

    // --- 3. BACK COVER ---
    doc.addPage([pdfWidth, pdfHeight]);
    doc.setFillColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.rect(0, 0, pdfWidth, pdfHeight, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, pdfHeight / 2, 0.6, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("CT", centerX, pdfHeight / 2 + 0.1, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Hand-crafted with ChildTale magic.", centerX, pdfHeight / 2 + 1.2, { align: "center" });

    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_home_edition.pdf`);
  } catch (error: any) {
    console.error("Home PDF Error", error);
    alert(`Failed: ${error.message}`);
  }
};

// Helper to wrap Worker in Promise for seamless await usage
const vectorizer = async (imageData: ImageData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new VectorWorker();
    worker.onmessage = (e) => {
      const { svg } = e.data;
      worker.terminate();
      resolve(svg);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    worker.postMessage({
      imageData,
      width: imageData.width,
      height: imageData.height,
      options: { scale: 2.0, threshold: 200 }
    });
  });
};

import VectorWorker from '../src/workers/vectorizer.worker?worker';

// --- VECTOR / INFINITE RESOLUTION ENGINES ---

export const createVectorInteriorDoc = async (story: Story, userInput: UserInput, onProgress?: (percent: number) => void) => {

  const pdfWidth = TRIM_WIDTH + (INTERIOR_BLEED * 2);
  const pdfHeight = TRIM_HEIGHT + (INTERIOR_BLEED * 2);
  const centerX = pdfWidth / 2;
  const safePrintWidth = TRIM_WIDTH - (0.5 * 2);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'in',
    format: [pdfWidth, pdfHeight]
  });

  // METADATA INJECTION: Professional Authorship & Print Specs
  doc.setProperties({
    title: story.title,
    subject: `A ChildTale Story for ${userInput.childName}`,
    author: story.authorName || userInput.childName,
    keywords: 'children, book, vector, 300dpi, print-ready',
    creator: 'ChildTale Magic Studio (Infinite Resolution Engine)'
  });

  // --- 1. TITLE PAGE ---
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

  // --- 3. VECTOR STORY PAGES ---
  const totalPages = story.pages.length;

  for (let i = 0; i < totalPages; i++) {
    if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 100));

    doc.addPage([pdfWidth, pdfHeight]);
    const page = story.pages[i];
    const imageUrl = page.coloredImageUrl || page.imageUrl;

    if (imageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);

          const svgString = await vectorizer(imageData);
          const parser = new DOMParser();
          const svgElem = parser.parseFromString(svgString, "image/svg+xml").documentElement;

          const imgW = safePrintWidth;
          const imgH = safePrintWidth;
          const imgX = (pdfWidth - imgW) / 2;
          const imgY = 1.0 + INTERIOR_BLEED;

          await doc.svg(svgElem, { x: imgX, y: imgY, width: imgW, height: imgH });

          doc.setLineWidth(0.01);
          doc.setDrawColor(0, 0, 0);
          doc.rect(imgX, imgY, imgW, imgH);
        }

        const textY = 1.0 + INTERIOR_BLEED + safePrintWidth + 0.5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        const splitText = doc.splitTextToSize(page.text, safePrintWidth);
        doc.text(splitText, centerX, textY, { align: "center", lineHeightFactor: 1.4 });

      } catch (e) {
        console.error(`VectorPage ${i + 1} fail:`, e);
      }
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`${i + 3}`, pdfWidth - 0.5, pdfHeight - 0.5, { align: "right" });
  }

  return doc;
};

export const createVectorCoverDoc = async (story: Story, userInput: UserInput) => {

  const spineWidth = Math.max(0.25, (story.pageCount || 25) / PPI);
  const singleCoverWidth = TRIM_WIDTH;
  const totalHeight = WRAP + COVER_BLEED + TRIM_HEIGHT + COVER_BLEED + WRAP;
  const totalWidth = (WRAP + COVER_BLEED + singleCoverWidth) * 2 + spineWidth;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'in',
    format: [totalWidth, totalHeight]
  });

  // Calculate Positions
  const xBackStart = WRAP + COVER_BLEED;
  const xSpineStart = xBackStart + singleCoverWidth;
  const xFrontStart = xSpineStart + spineWidth;
  const yTrimTop = WRAP + COVER_BLEED;
  const yTrimBottom = yTrimTop + TRIM_HEIGHT;
  const backCenterX = xBackStart + (singleCoverWidth / 2);
  const frontCenterX = xFrontStart + (singleCoverWidth / 2);
  const spineCenterX = xSpineStart + (spineWidth / 2);
  const coverCenterY = totalHeight / 2;

  // Background
  const themeRgb = getThemeColor(story.category);
  doc.setFillColor(themeRgb[0], themeRgb[1], themeRgb[2]);
  doc.rect(0, 0, totalWidth, totalHeight, 'F');

  // FRONT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(getCategoryLabel(story.category), frontCenterX, yTrimTop + 1.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(0, 0, 0);
  const fullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
  const titleLines = doc.splitTextToSize(fullTitle, singleCoverWidth - 1.5);
  doc.text(titleLines, frontCenterX, yTrimTop + 2.5, { align: "center" });

  const author = story.authorName || "ChildTale";
  doc.setFontSize(14);
  doc.text(`By ${author}`, frontCenterX, yTrimTop + 4.0, { align: "center" });

  // VECTOR COVER IMAGE
  const coverImg = story.coverImage;
  if (coverImg) {
    try {
      const imgSize = 5.5;
      const imgY = yTrimTop + 4.5;
      const imgX = frontCenterX - (imgSize / 2);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = coverImg + (coverImg.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // VECTORIZE
        const svgString = await vectorizer(imageData);
        const parser = new DOMParser();
        const svgElem = parser.parseFromString(svgString, "image/svg+xml").documentElement;

        await doc.svg(svgElem, { x: imgX, y: imgY, width: imgSize, height: imgSize });

        doc.setLineWidth(0.05);
        doc.setDrawColor(255, 255, 255);
        doc.rect(imgX, imgY, imgSize, imgSize);
      }
    } catch (e) { console.error("Vector Cover Image Error:", e); }
  }

  // SPINE
  if ((story.pageCount || 25) >= 100) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const spineFullTitle = story.subtitle ? `${story.title}: ${story.subtitle}` : story.title;
    doc.text(spineFullTitle.toUpperCase(), spineCenterX, yTrimTop + 1.5, {
      align: 'right',
      angle: -90
    });
  }

  // BACK
  doc.setFont("helvetica", "italic");
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  const backMsg = [`This book was made specifically for`, `${userInput.childName}`];
  doc.text(backMsg, backCenterX, coverCenterY - 1, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Made with ChildTale", backCenterX, yTrimBottom - 1.5, { align: "center" });

  doc.setFillColor(255, 255, 255);
  doc.circle(backCenterX, yTrimBottom - 2.5, 0.4, 'F');
  doc.setFontSize(8);
  doc.text("CT", backCenterX, yTrimBottom - 2.4, { align: "center" });

  // ISBN Barcode Box
  const barcodeW = 3.625;
  const barcodeH = 1.25;
  const barcodeX = xSpineStart - barcodeW - 0.5;
  const barcodeY = totalHeight - 0.5 - barcodeH;

  doc.setFillColor(255, 255, 255);
  doc.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.01);
  doc.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'S');

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ISBN BARCODE AREA", barcodeX + (barcodeW / 2), barcodeY + (barcodeH / 2) + 0.05, { align: "center" });

  return doc;
};

// --- VECTOR BLOB EXPORTS ---

export const getLuluVectorInteriorBlob = async (story: Story, userInput: UserInput): Promise<Blob> => {
  const doc = await createVectorInteriorDoc(story, userInput);
  return doc.output('blob');
};

export const getLuluVectorCoverBlob = async (story: Story, userInput: UserInput): Promise<Blob> => {
  const doc = await createVectorCoverDoc(story, userInput);
  return doc.output('blob');
};

// --- LEGACY/DEV HELPERS (DOWNLOADERS) ---

export const generateVectorPDF = async (story: Story, userInput: UserInput, onProgress?: (percent: number) => void) => {
  try {
    const doc = await createVectorInteriorDoc(story, userInput, onProgress);
    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_infinite_resolution.pdf`);
  } catch (error: any) {
    console.error("Vector PDF Error:", error);
    alert(`Export Failed: ${error.message}`);
  }
};

export const generatePDF = async (story: Story, userInput: UserInput, mode: 'bw' | 'color' = 'bw') => {
  await generateLuluInteriorPDF(story, userInput);
};
