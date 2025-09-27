const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const pdfPoppler = require('pdf-poppler');

// Import configuration and utilities.  These modules are expected to be
// located relative to a `config` and `utils` directory respectively.  If
// your project structure differs you may need to adjust these paths.
const { POPPLER_PATH, TESSERACT_LANG } = require('../config/constants');
const { preprocessImage } = require("../utils/util");
   // adjust to ../utils/util if that's your path
// Import parsers.  Each parser encapsulates knowledge about a specific
// document type.  These modules should reside in a `parsers` directory
// at the project root.  Adjust the relative path if necessary.
const { PrescriptionParser } = require('../parsers/parser_prescription');
const { PatientDetailsParser } = require('../parsers/parser_patient_details');
const { LabTestParser } = require('../parsers/parser_lab_tests');

// Ensure Poppler binaries on PATH (Windows only)
if (process.platform === 'win32' && POPPLER_PATH) {
  process.env.PATH = `${POPPLER_PATH};${process.env.PATH}`;
}

/**
 * Extract structured data from a document (PDF or Image).
 *
 * PDF:   convert → PNGs → OCR all pages
 * Image: preprocess → OCR
 */
/**
 * Extract structured data from a document.  Supports PDFs, images and
 * raw text.  When a filename is supplied the file is processed via
 * OCR (using Poppler and Tesseract).  When raw text is provided the
 * text is parsed directly.
 *
 * @param {string|undefined} filePath Path to the file to process.  If
 *   undefined and `text` is provided, the text will be parsed without
 *   performing OCR.
 * @param {string} fileFormat One of: `prescription`, `patient_details`,
 *   `lab_report`.
 * @param {string} [text] Optional raw text to parse directly.  If
 *   provided and `filePath` is falsy, OCR is skipped and this value is
 *   used as the document text.  When both `filePath` and `text` are
 *   provided, `filePath` takes precedence.
 */
async function extract(filePath, fileFormat, text) {
  // Allow callers to bypass OCR by providing raw text directly.  When
  // text is available and no filePath is given we can skip all image
  // preprocessing and OCR work and simply parse the text.  This
  // behaviour is used by the controller when the client sends free‑form
  // text rather than uploading a file.
  let usingRawText = false;
  let documentText = '';
  let confidences = [];

  if (!filePath && typeof text === 'string') {
    usingRawText = true;
    documentText = text;
    confidences = [100];
  }

  // When processing a file we need to infer the extension.  If the
  // caller passed a truthy `filePath` then run the existing OCR
  // pipeline, otherwise we fall through to parsing.
  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();

    // ---------- Case 1: PDF ----------
    if (ext === '.pdf') {
      const { dir, name } = path.parse(filePath);
      const outputDir = path.join(dir, `${name}_pages_${Date.now()}`);
      await fs.promises.mkdir(outputDir, { recursive: true });

      // Step 1: Convert PDF → PNGs
      try {
        await pdfPoppler.convert(filePath, {
          format: 'png',
          out_dir: outputDir,
          out_prefix: name,
          page: null,
        });
      } catch (err) {
        await fs.promises.rm(outputDir, { recursive: true, force: true });
        throw new Error(`Failed to convert PDF to images: ${err.message}`);
      }

      // Step 2: OCR each page
      const worker = await createWorker(TESSERACT_LANG);
      try {
        let imageFiles = await fs.promises.readdir(outputDir);
        imageFiles = imageFiles
          .filter(f => f.toLowerCase().endsWith('.png') && f.startsWith(name))
          .sort((a, b) => {
            const aPage = parseInt(a.replace(/[^\d]/g, ''), 10);
            const bPage = parseInt(b.replace(/[^\d]/g, ''), 10);
            return aPage - bPage;
          });

        let pageNum = 1;
        for (const filename of imageFiles) {
          const imagePath = path.join(outputDir, filename);
          const imageBuffer = await fs.promises.readFile(imagePath);
          const processedBuffer = await preprocessImage(imageBuffer);

          const { data } = await worker.recognize(processedBuffer);
          documentText += '\n' + data.text;

          console.log(`Page ${pageNum} OCR confidence: ${(data.confidence / 100).toFixed(2)}`);
          confidences.push(data.confidence);
          pageNum++;
        }
      } finally {
        await worker.terminate();
        await fs.promises.rm(outputDir, { recursive: true, force: true });
      }
    }

    // ---------- Case 2: Image (PNG/JPG/JPEG) ----------
    else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const buffer = await fs.promises.readFile(filePath);
      const processedBuffer = await preprocessImage(buffer);

      const worker = await createWorker(TESSERACT_LANG);
      try {
        const { data } = await worker.recognize(processedBuffer);
        documentText = data.text;
        confidences.push(data.confidence);
      } finally {
        await worker.terminate();
      }
    }

    else {
      throw new Error(`Unsupported file type: ${ext}. Only PDF, PNG, JPG supported.`);
    }
  }

  // If we haven't already set `usingRawText` then we have processed a
  // file.  Otherwise `documentText` already holds the provided text.
  // Compute average confidence from recorded values.  When parsing raw
  // text the confidence is assumed to be 1.0 (100%).
  const avgConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 100;

  console.log(`Average OCR confidence: ${((avgConfidence) / 100).toFixed(2)}`);

  // ---------- Step 4: Parse according to type ----------
  let parsedData;
  switch (fileFormat) {
    case 'prescription':
      parsedData = new PrescriptionParser(documentText).parse();
      break;
    case 'patient_details':
      parsedData = new PatientDetailsParser(documentText).parse();
      break;
    case 'lab_report':
      parsedData = new LabTestParser(documentText).parse();
      break;
    default:
      throw new Error(`Invalid document format: ${fileFormat}`);
  }

  return {
    tests_raw: documentText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0),
    // Normalize confidence to 0–1 range
    confidence: parseFloat(((avgConfidence) / 100).toFixed(2)),
    parsed: parsedData,
  };
}

/**
 * Extract structured data from raw text.  This is a convenience
 * wrapper around `extract` that passes `undefined` for the file
 * parameter.  It exists to make the controller code easier to
 * understand.
 *
 * @param {string} text Raw text to parse.
 * @param {string} fileFormat One of: `prescription`,
 *   `patient_details`, `lab_report`.
 */
async function extractFromText(text, fileFormat) {
  return extract(undefined, fileFormat, text);
}

module.exports = { extract, extractFromText };
