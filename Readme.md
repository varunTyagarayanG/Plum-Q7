# Document Extraction and Analysis API

This repository contains a **Node.js/Express** backend for extracting structured data from medical PDF documents.  
It combines *OCR*, *parsing*, *normalisation* and optional *summarisation* to produce JSON outputs that are easy to consume in downstream applications.  
The codebase is structured around **services**, **controllers** and **routes** to promote maintainability.

---

## Features

- 📄 **PDF OCR** using [Tesseract.js](https://github.com/naptha/tesseract.js) and [Poppler](https://poppler.freedesktop.org/).
- 🧪 **Parsers** for prescriptions, patient details, and lab reports.
- 🔎 **Normalisation** of extracted test names, units, and reference ranges with typo correction.
- ✅ **Guardrails** for hallucination prevention (ensures only real tests are output).
- 📊 **Summarisation** using Gemini API to create patient‑friendly summaries of results.
- 🗂 **Persistent storage** of both PDF uploads and JSON results.
- 🛠 **Modular architecture** (controllers, services, routes, utils).

---

## Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/varunTyagarayanG/Plum-Q7.git
   cd document-extraction-api
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Install system dependencies**  
   Ensure [Poppler](https://poppler.freedesktop.org/) and [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) are installed and available in your PATH.

   Example (Ubuntu/Debian):  
   ```bash
   sudo apt-get install poppler-utils tesseract-ocr
   ```

4. **Environment variables**  
   Create a `.env` file in the project root:
   ```ini
   PORT=8000
   GEMINI_API_KEY=your_google_generative_api_key
   POPPLER_PATH=/usr/bin
   TESSERACT_LANG=eng
   ```

5. **Start the server**  
   ```bash
   npm start
   ```

---

## Project Structure

```
src/
 ├── server/
 │   └── index.js           # Express entrypoint
 ├── controllers/           # Route handlers
 ├── routes/                # Endpoint definitions
 ├── services/
 │   ├── extractor.js       # OCR and parser logic
 │   └── normalizer.js      # Normalisation and cleaning
 ├── parsers/
 │   ├── parser_generic.js
 │   ├── parser_lab_tests.js
 │   ├── parser_patient_details.js
 │   └── parser_prescription.js
 ├── utils/
 │   └── util.js
 └── config/
     └── constants.js
uploads/                    # Temporary uploaded PDFs
results/                    # Saved JSON outputs
```

---

## API Endpoints

### 🔹 Extract raw OCR text
```bash
POST /extract_raw
```

**Response:**
```json
{
  "tests_raw": ["Hemoglobin 10.2 g/dL (Low)", "WBC 11200 /uL (High)"],
  "confidence": 0.80
}
```

---

### 🔹 Extract normalized tests
```bash
POST /extract_normalized
```

**Response:**
```json
{
  "tests": [
    {"name":"Hemoglobin","value":10.2,"unit":"g/dL","status":"low","ref_range":{"low":12.0,"high":15.0}},
    {"name":"WBC","value":11200,"unit":"/uL","status":"high","ref_range":{"low":4000,"high":11000}}
  ],
  "normalization_confidence": 0.9
}
```

---

### 🔹 Extract with patient‑friendly summary
```bash
POST /extract_summary
```

**Response:**
```json
{
  "tests": [...],
  "summary": "Low hemoglobin and high white blood cell count.",
  "status": "ok"
}
```

---

### 🔹 Full pipeline (final output)
```bash
POST /extract_final
```

**Response:**
```json
{
  "tests": [
    {"name":"Hemoglobin","value":10.2,"unit":"g/dL","status":"low","ref_range":{"low":12.0,"high":15.0}},
    {"name":"WBC","value":11200,"unit":"/uL","status":"high","ref_range":{"low":4000,"high":11000}}
  ],
  "summary": "Low hemoglobin and high white blood cell count.",
  "status": "ok"
}
```

---

## Development Notes

- Uses **multer** for file uploads and **axios** for Gemini API calls.
- Temporary files created in `uploads/` are auto‑cleaned after processing.
- Summaries use Gemini fallback logic (`gemini-1.5-flash-8b-latest` by default).
- Normalisation handles decimals, duplicates, and outliers automatically.
- Guardrails prevent hallucinated tests from appearing in results.

 are encouraged.

---

## License

Released under the **MIT License**.
