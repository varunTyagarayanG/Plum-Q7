  /**
   * Copyright (c) 2025 varunTyagarayanG
   *
   * Licensed under the MIT License.
   */
  const path = require('path');
require('dotenv').config();
/*
 * Configuration constants for the document extraction service.
 *
 * These values centralise environment-specific settings so that
 * other modules can simply import them without worrying about
 * platform differences or environment variables.  If Poppler or
 * Tesseract are installed in non‑standard locations, adjust
 * the environment variables POPPLER_PATH and TESSERACT_LANG
 * accordingly.
 */

/**
 * Path to the Poppler binaries.  On Windows this defaults to the
 * location used in the original implementation.  You can override
 * this by setting the POPPLER_PATH environment variable.
 *
 * For non‑Windows platforms Poppler is typically installed in
 * your system PATH and does not require configuration.
 */
const POPPLER_PATH = process.env.POPPLER_PATH

/**
 * Default language for Tesseract OCR.  If your documents are in
 * another language, set the TESSERACT_LANG environment variable.
 */
const TESSERACT_LANG = process.env.TESSERACT_LANG 

module.exports = {
  POPPLER_PATH,
  TESSERACT_LANG,
};