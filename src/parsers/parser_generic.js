/**
 * Base class for medical document parsers.
 *
 * Parsers for specific document formats (prescriptions,
 * patient details, lab reports) should extend this class and
 * implement the parse method.  This file lives in
 * `src/parsers` so that all parser implementations share a
 * common relative import path.
 */
class MedicalDocParser {
  /**
   * Construct a new parser instance.
   *
   * @param {string} text - The raw text extracted from the document.
   */
  constructor(text) {
    this.text = text || '';
  }

  /**
   * Parse the document into structured data.  Subclasses must
   * override this method.
   *
   * @abstract
   * @returns {Object}
   */
  parse() {
    throw new Error('parse() must be implemented by subclasses');
  }
}

module.exports = { MedicalDocParser };