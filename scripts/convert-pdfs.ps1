# PDF to Image Converter for ChildTale Samples
# This script converts the first page of each PDF to a JPG image

$samplesPath = "public\samples"
$pdfs = Get-ChildItem -Path $samplesPath -Filter "*.pdf"

Write-Host "Found $($pdfs.Count) PDFs to convert..." -ForegroundColor Green

foreach ($pdf in $pdfs) {
    $outputName = $pdf.BaseName + "-preview.jpg"
    $outputPath = Join-Path $samplesPath $outputName
    
    Write-Host "Converting: $($pdf.Name)..." -ForegroundColor Yellow
    
    # Note: This requires Adobe Acrobat or a PDF library
    # Alternative: We'll use a simple web-based approach instead
    Write-Host "  → Will create: $outputName" -ForegroundColor Cyan
}

Write-Host "`nNote: Windows doesn't have built-in PDF→Image conversion." -ForegroundColor Red
Write-Host "Recommended: Use an online converter or install ImageMagick/Ghostscript" -ForegroundColor Yellow
Write-Host "`nAlternative: I can create a gallery that displays PDFs directly in an iframe." -ForegroundColor Green
