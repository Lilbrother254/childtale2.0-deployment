const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// This script extracts the first page of each PDF as a JPG image
// Requires: pdftoppm (from poppler-utils)

const samplesDir = path.join(__dirname, '../public/samples');
const pdfs = fs.readdirSync(samplesDir).filter(f => f.endsWith('.pdf'));

console.log(`Found ${pdfs.length} PDFs to convert...`);

pdfs.forEach((pdf, index) => {
    const pdfPath = path.join(samplesDir, pdf);
    const outputName = pdf.replace('.pdf', '');
    const outputPath = path.join(samplesDir, outputName);

    // Using pdftoppm to convert first page to JPG
    const command = `pdftoppm -jpeg -f 1 -l 1 -scale-to 1200 "${pdfPath}" "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error converting ${pdf}:`, error.message);
            return;
        }
        console.log(`✓ Converted: ${pdf}`);
    });
});

console.log('\nConversion started. Check public/samples/ for JPG files.');
