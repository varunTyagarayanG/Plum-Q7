const { MedicalDocParser } = require('./parser_generic');

/*
MIT License
Copyright (c) 2024 varunTyagarayanG

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/**
 * Parser for prescription documents.
 *
 * Extracts the patient name, address, list of medicines,
 * directions for consumption and the number of refills from
 * the text.  The patterns mirror those used in the original
 * implementation and have been ported here for consistency.
 */
class PrescriptionParser extends MedicalDocParser {
  constructor(text) {
    super(text);
  }

  /**
   * Return a structured representation of a prescription.
   *
   * @returns {{
   *   patient_name: string|undefined,
   *   patient_address: string|undefined,
   *   medicines: string|undefined,
   *   directions: string|undefined,
   *   refills: string|undefined,
   * }}
   */
  parse() {
    return {
      patient_name: this.getField('patient_name'),
      patient_address: this.getField('patient_address'),
      medicines: this.getField('medicines'),
      directions: this.getField('directions'),
      refills: this.getField('refills'),
    };
  }

  /**
   * Apply a predefined regular expression to extract a field.
   *
   * @param {string} fieldName - One of the supported field names.
   * @returns {string|undefined} The matched value, trimmed of whitespace.
   */
  getField(fieldName) {
    const patternDict = {
      patient_name: { pattern: 'Name:(.*)Date', flags: '' },
      patient_address: { pattern: 'Address:(.*)\n', flags: '' },
      medicines: { pattern: 'Address[^\n]*(.*)Directions', flags: 's' },
      directions: { pattern: 'Directions:(.*)Refill', flags: 's' },
      refills: { pattern: 'Refill:(.*)times', flags: '' },
    };

    const patternObject = patternDict[fieldName];
    if (!patternObject) {
      return undefined;
    }
    const regex = new RegExp(patternObject.pattern, patternObject.flags);
    const match = this.text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return undefined;
  }
}

module.exports = { PrescriptionParser };