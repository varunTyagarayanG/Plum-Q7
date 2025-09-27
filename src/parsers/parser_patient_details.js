const { MedicalDocParser } = require('./parser_generic');

/**
 * Parser for patient details documents.
 *
 * Extracts the patient name, phone number, any reported medical
 * problems, and Hepatitis B vaccination status using regular
 * expressions analogous to those in the Python implementation.
 */
class PatientDetailsParser extends MedicalDocParser {
  constructor(text) {
    super(text);
  }

  /**
   * Parse the patient details document.
   *
   * @returns {{
   *   patient_name: string,
   *   phone_number: string|undefined,
   *   medical_problems: string|undefined,
   *   hepatitis_b_vaccination: string|undefined,
   * }}
   */
  parse() {
    return {
      patient_name: this.getPatientName(),
      phone_number: this.getPatientPhoneNumber(),
      medical_problems: this.getMedicalProblems(),
      hepatitis_b_vaccination: this.getHepatitisBVaccination(),
    };
  }

  /**
   * Extract the patient's name from the document.
   *
   * The parser looks for text following 'Patient Information' up to
   * the first phone number, then removes the birth date and other
   * noise.  If no name can be found, an empty string is returned.
   *
   * @returns {string}
   */
  getPatientName() {
    const pattern = /Patient Information(.*?)\(\d{3}\)/s;
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
    const matches = this.text.match(pattern);
    let name = '';
    if (matches) {
      name = this.removeNoiseFromName(matches[1]);
    }
    return name;
  }

  /**
   * Extract the phone number from the document.
   *
   * Looks for a pattern like '(123) 456-7890' following 'Patient Information'.
   *
   * @returns {string|undefined}
   */
  getPatientPhoneNumber() {
    const pattern = /Patient Information(.*?)(\(\d{3}\) \d{3}-\d{4})/s;
    const matches = this.text.match(pattern);
    if (matches) {
      // Return the last capturing group containing the phone number
      return matches[matches.length - 1];
    }
    return undefined;
  }

  /**
   * Remove noise such as 'Birth Date' and date strings from the name
   * section.  This mirrors the logic of the Python implementation.
   *
   * @param {string} name - The raw substring extracted from the document.
   * @returns {string}
   */
  removeNoiseFromName(name) {
    let cleaned = name.replace('Birth Date', '').trim();
    const datePattern = /((Jan|Feb|March|April|May|June|July|Aug|Sep|Oct|Nov|Dec)[ \d]+)/;
    const dateMatches = cleaned.match(datePattern);
    if (dateMatches) {
      cleaned = cleaned.replace(dateMatches[0], '').trim();
    }
    return cleaned;
  }

  /**
   * Determine whether the patient has had a Hepatitis B vaccination.
   *
   * Searches for 'Have you had the Hepatitis B vaccination?' followed by
   * either 'Yes' or 'No'.  Returns 'Yes' or 'No' if found.
   *
   * @returns {string|undefined}
   */
  getHepatitisBVaccination() {
    const pattern = /Have you had the Hepatitis B vaccination\?.*(Yes|No)/s;
    const matches = this.text.match(pattern);
    if (matches) {
      return matches[matches.length - 1].trim();
    }
    return undefined;
  }

  /**
   * Extract any listed medical problems.
   *
   * Looks for text after 'List any Medical Problems' up to a colon and
   * captures everything following that colon.  Whitespace is trimmed.
   *
   * @returns {string|undefined}
   */
  getMedicalProblems() {
    const pattern = /List any Medical Problems .*?:\s*(.*)/s;
    const matches = this.text.match(pattern);
    if (matches) {
      return matches[matches.length - 1].trim();
    }
    return undefined;
  }
}

module.exports = { PatientDetailsParser };