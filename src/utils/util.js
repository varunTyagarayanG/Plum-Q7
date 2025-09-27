const sharp = require('sharp');

/**
 * Preprocess an image for OCR.
 *
 * - Resize up for clarity (helps Tesseract pick up small dots/characters).
 * - Convert to grayscale.
 * - Apply thresholding to keep dots (decimal points) sharp.
 */
async function preprocessImage(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('preprocessImage expects a Buffer');
  }

  return await sharp(buffer)
    .resize({ width: 2500 })   // upscale
    .greyscale()
    .threshold(180)            // binarize
    .toBuffer();
}

module.exports = { preprocessImage };
