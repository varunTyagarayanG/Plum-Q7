const fs = require("fs");
const path = require("path");
const multer = require("multer");
// Import services and utilities.  These modules are expected to reside
// under the `services` and `utils` directories as originally designed.
// We additionally import `extractFromText` which will be exposed by
// the extractor service to support raw text inputs.
const { extract, extractFromText } = require("../services/extractor");
const { normalizeTests, filterByRange, deduplicateTests } = require("../services/normalizer");
const { extractSummary } = require("../services/summaryService");
const { preprocessImage } = require("../utils/util");


const upload = multer();
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const RESULTS_DIR = path.join(__dirname, "..", "..", "results");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(RESULTS_DIR, { recursive: true });

/**
 * Utility: Build summary of tests
 */
function buildSummary(tests) {
    const abnormal = tests.filter(t => ["low", "high", "abnormal"].includes(t.status));
    const normal = tests.filter(t => t.status === "normal");

    return {
        abnormal: abnormal.map(t => ({ name: t.name, value: t.value, unit: t.unit, status: t.status })),
        normal: normal.map(t => ({ name: t.name, value: t.value, unit: t.unit })),
    };
}

/**
 * POST /extract_from_doc
 */
exports.extractFromDoc = [
    upload.single("file"),
    async (req, res) => {
        const fileFormat = req.body.file_format;
        const uploadedFile = req.file;
        const textInput = req.body.text;

        // Validate required parameters: either a file or a text body must be provided
        if (!fileFormat || (!uploadedFile && !textInput)) {
            return res.status(400).json({ error: "file_format and either file or text are required" });
        }

        // If text is provided, bypass the file upload and directly parse the content
        if (textInput && !uploadedFile) {
            try {
                const step1 = await extractFromText(textInput, fileFormat);
                const step2 = normalizeTests(step1.tests_raw || []);
                const summary = buildSummary(step2.tests);

                let status = "ok", reason;
                if ((step1.tests_raw || []).length > 0 && (step2.tests || []).length === 0) {
                    status = "unprocessed";
                    reason = "raw text had entries but no normalized matches";
                }

                const timestamp = Date.now();
                const result = { timestamp, file: null, step1, step2, summary, status, reason };
                const resultPath = path.join(RESULTS_DIR, `${timestamp}_result.json`);
                await fs.promises.writeFile(resultPath, JSON.stringify(result, null, 2));

                return res.json(result);
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Below is the original behaviour when a file is uploaded
        const mimeType = uploadedFile.mimetype;
        const isPdf = mimeType && mimeType.toLowerCase().includes("pdf");
        const isImage = mimeType && mimeType.toLowerCase().startsWith("image");

        // Only support PDF or image types when processing files
        if (!isPdf && !isImage) {
            return res.status(400).json({ error: "Only PDF or image (PNG/JPEG) documents are supported" });
        }

        const timestamp = Date.now();
        // Determine appropriate filename and path based on file type
        const extension = isPdf ? "pdf" : (mimeType.split("/")[1] || "png");
        const filename = `${timestamp}.${extension}`;
        const filePath = path.join(UPLOAD_DIR, filename);

        try {
            let bufferToWrite;
            // If image, preprocess before saving
            if (isImage) {
                try {
                    bufferToWrite = await preprocessImage(uploadedFile.buffer);
                } catch (err) {
                    return res.status(500).json({ error: `Image preprocessing failed: ${err.message}` });
                }
            } else {
                bufferToWrite = uploadedFile.buffer;
            }

            await fs.promises.writeFile(filePath, bufferToWrite);

            // Use the provided file_format to extract data
            const step1 = await extract(filePath, fileFormat);
            const step2 = normalizeTests(step1.tests_raw || []);
            const summary = buildSummary(step2.tests);

            let status = "ok", reason;
            if ((step1.tests_raw || []).length > 0 && (step2.tests || []).length === 0) {
                status = "unprocessed";
                reason = "raw text had entries but no normalized matches";
            }

            const result = { timestamp, file: filename, step1, step2, summary, status, reason };
            const resultPath = path.join(RESULTS_DIR, `${timestamp}_result.json`);
            await fs.promises.writeFile(resultPath, JSON.stringify(result, null, 2));

            return res.json(result);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
];

/**
 * POST /extract_minimal
 */
exports.extractMinimal = [
    upload.single("file"),
    async (req, res) => {
        const fileFormat = req.body.file_format;
        const uploadedFile = req.file;
        const textInput = req.body.text;

        if (!fileFormat || (!uploadedFile && !textInput)) {
            return res.status(400).json({ error: "file_format and either file or text are required" });
        }

        // When text is provided directly we skip file processing
        if (textInput && !uploadedFile) {
            try {
                const step1 = await extractFromText(textInput, fileFormat);
                const step2 = normalizeTests(step1.tests_raw || []);

                let minimal = (step2.tests || []).map(t => ({
                    name: t.name,
                    value: t.value,
                    unit: t.unit,
                    range: t.ref_range
                }));
                minimal = filterByRange(minimal);
                minimal = deduplicateTests(minimal);

                return res.json({ tests: minimal });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Otherwise process the uploaded file
        const mimeType = uploadedFile.mimetype;
        const isPdf = mimeType && mimeType.toLowerCase().includes("pdf");
        const isImage = mimeType && mimeType.toLowerCase().startsWith("image");
        if (!isPdf && !isImage) {
            return res.status(400).json({ error: "Only PDF or image (PNG/JPEG) documents are supported" });
        }

        const timestamp = Date.now();
        const extension = isPdf ? "pdf" : (mimeType.split("/")[1] || "png");
        const tempPath = path.join(UPLOAD_DIR, `temp_${timestamp}.${extension}`);
        try {
            let bufferToWrite;
            if (isImage) {
                try {
                    bufferToWrite = await preprocessImage(uploadedFile.buffer);
                } catch (err) {
                    return res.status(500).json({ error: `Image preprocessing failed: ${err.message}` });
                }
            } else {
                bufferToWrite = uploadedFile.buffer;
            }
            await fs.promises.writeFile(tempPath, bufferToWrite);

            const step1 = await extract(tempPath, fileFormat);
            const step2 = normalizeTests(step1.tests_raw || []);

            let minimal = (step2.tests || []).map(t => ({
                name: t.name,
                value: t.value,
                unit: t.unit,
                range: t.ref_range
            }));
            minimal = filterByRange(minimal);
            minimal = deduplicateTests(minimal);

            await fs.promises.unlink(tempPath);
            return res.json({ tests: minimal });
        } catch (err) {
            try { await fs.promises.unlink(tempPath); } catch { }
            return res.status(500).json({ error: err.message });
        }
    }
];

/**
 * POST /extract_raw
 */
exports.extractRaw = [
    upload.single("file"),
    async (req, res) => {
        const uploadedFile = req.file;
        const textInput = req.body.text;

        if (!uploadedFile && !textInput) {
            return res.status(400).json({ error: "Either file or text is required" });
        }

        // When raw text is provided, bypass OCR completely
        if (textInput && !uploadedFile) {
            try {
                const step1 = await extractFromText(textInput, "lab_report");
                return res.json({ tests_raw: step1.tests_raw, confidence: step1.confidence });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Otherwise process the uploaded file
        const mimeType = uploadedFile.mimetype;
        const isPdf = mimeType && mimeType.toLowerCase().includes("pdf");
        const isImage = mimeType && mimeType.toLowerCase().startsWith("image");
        if (!isPdf && !isImage) {
            return res.status(400).json({ error: "Only PDF or image (PNG/JPEG) documents are supported" });
        }

        const timestamp = Date.now();
        const extension = isPdf ? "pdf" : (mimeType.split("/")[1] || "png");
        const tempPath = path.join(UPLOAD_DIR, `raw_${timestamp}.${extension}`);
        try {
            let bufferToWrite;
            if (isImage) {
                try {
                    bufferToWrite = await preprocessImage(uploadedFile.buffer);
                } catch (err) {
                    return res.status(500).json({ error: `Image preprocessing failed: ${err.message}` });
                }
            } else {
                bufferToWrite = uploadedFile.buffer;
            }
            await fs.promises.writeFile(tempPath, bufferToWrite);
            const step1 = await extract(tempPath, "lab_report");
            await fs.promises.unlink(tempPath);

            return res.json({ tests_raw: step1.tests_raw, confidence: step1.confidence });
        } catch (err) {
            try { await fs.promises.unlink(tempPath); } catch { }
            return res.status(500).json({ error: err.message });
        }
    }
];

/**
 * POST /extract_normalized
 */
exports.extractNormalized = [
    upload.single("file"),
    async (req, res) => {
        const uploadedFile = req.file;
        const textInput = req.body.text;

        if (!uploadedFile && !textInput) {
            return res.status(400).json({ error: "Either file or text is required" });
        }

        // Handle raw text
        if (textInput && !uploadedFile) {
            try {
                const step1 = await extractFromText(textInput, "lab_report");
                const step2 = normalizeTests(step1.tests_raw || []);
                return res.json(step2);
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Otherwise process uploaded file
        const mimeType = uploadedFile.mimetype;
        const isPdf = mimeType && mimeType.toLowerCase().includes("pdf");
        const isImage = mimeType && mimeType.toLowerCase().startsWith("image");
        if (!isPdf && !isImage) {
            return res.status(400).json({ error: "Only PDF or image (PNG/JPEG) documents are supported" });
        }

        const timestamp = Date.now();
        const extension = isPdf ? "pdf" : (mimeType.split("/")[1] || "png");
        const tempPath = path.join(UPLOAD_DIR, `norm_${timestamp}.${extension}`);
        try {
            let bufferToWrite;
            if (isImage) {
                try {
                    bufferToWrite = await preprocessImage(uploadedFile.buffer);
                } catch (err) {
                    return res.status(500).json({ error: `Image preprocessing failed: ${err.message}` });
                }
            } else {
                bufferToWrite = uploadedFile.buffer;
            }
            await fs.promises.writeFile(tempPath, bufferToWrite);
            const step1 = await extract(tempPath, "lab_report");
            await fs.promises.unlink(tempPath);

            const step2 = normalizeTests(step1.tests_raw || []);
            return res.json(step2);
        } catch (err) {
            try { await fs.promises.unlink(tempPath); } catch { }
            return res.status(500).json({ error: err.message });
        }
    }
];

/**
 * POST /extract_summary
 */
exports.extractSummaryCtrl = [
    upload.single("file"),
    async (req, res) => {
        const uploadedFile = req.file;
        const textInput = req.body.text;
        if (!uploadedFile && !textInput) {
            return res.status(400).json({ error: "Either file or text is required" });
        }

        // Handle raw text
        if (textInput && !uploadedFile) {
            try {
                const step1 = await extractFromText(textInput, "lab_report");
                const step2 = normalizeTests(step1.tests_raw);
                const summary = await extractSummary(step2.tests);
                return res.json({ tests: step2.tests, normalization_confidence: step2.confidence, summary });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Process uploaded file
        const mimeType = uploadedFile.mimetype;
        const isPdf = mimeType && mimeType.toLowerCase().includes("pdf");
        const isImage = mimeType && mimeType.toLowerCase().startsWith("image");
        if (!isPdf && !isImage) {
            return res.status(400).json({ error: "Only PDF or image (PNG/JPEG) documents are supported" });
        }

        const timestamp = Date.now();
        const extension = isPdf ? "pdf" : (mimeType.split("/")[1] || "png");
        const tempPath = path.join(UPLOAD_DIR, `summary_${timestamp}.${extension}`);
        try {
            let bufferToWrite;
            if (isImage) {
                try {
                    bufferToWrite = await preprocessImage(uploadedFile.buffer);
                } catch (err) {
                    return res.status(500).json({ error: `Image preprocessing failed: ${err.message}` });
                }
            } else {
                bufferToWrite = uploadedFile.buffer;
            }
            await fs.promises.writeFile(tempPath, bufferToWrite);
            const step1 = await extract(tempPath, "lab_report");
            const step2 = normalizeTests(step1.tests_raw);

            const summary = await extractSummary(step2.tests);
            await fs.promises.unlink(tempPath);

            return res.json({ tests: step2.tests, normalization_confidence: step2.confidence, summary });
        } catch (err) {
            try { await fs.promises.unlink(tempPath); } catch { }
            return res.status(500).json({ error: err.message });
        }
    }
];

/**
 * POST /extract_final
 */
exports.extractFinal = [
    upload.single("file"),
    async (req, res) => {
        const uploadedFile = req.file;
        const textInput = req.body.text;
        if (!uploadedFile && !textInput) {
            return res.status(400).json({ error: "Either file or text is required" });
        }

        // Handle text input directly
        if (textInput && !uploadedFile) {
            try {
                const step1 = await extractFromText(textInput, "lab_report");
                const step2 = normalizeTests(step1.tests_raw || []);
                const summaryResult = await extractSummary(step2.tests);

                const finalOutput = {
                    tests: step2.tests,
                    summary: summaryResult.summary || summaryResult.error || "Summary unavailable",
                    status: summaryResult.error ? "unprocessed" : "ok"
                };

                return res.json(finalOutput);
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }

        // Process uploaded file
        const mimeType = uploadedFile.mimetype;
        const isPdf = mimeType && mimeType.toLowerCase().includes("pdf");
        const isImage = mimeType && mimeType.toLowerCase().startsWith("image");
        if (!isPdf && !isImage) {
            return res.status(400).json({ error: "Only PDF or image (PNG/JPEG) documents are supported" });
        }

        const timestamp = Date.now();
        const extension = isPdf ? "pdf" : (mimeType.split("/")[1] || "png");
        const tempPath = path.join(UPLOAD_DIR, `final_${timestamp}.${extension}`);
        try {
            let bufferToWrite;
            if (isImage) {
                try {
                    bufferToWrite = await preprocessImage(uploadedFile.buffer);
                } catch (err) {
                    return res.status(500).json({ error: `Image preprocessing failed: ${err.message}` });
                }
            } else {
                bufferToWrite = uploadedFile.buffer;
            }
            await fs.promises.writeFile(tempPath, bufferToWrite);
            const step1 = await extract(tempPath, "lab_report");
            const step2 = normalizeTests(step1.tests_raw || []);
            const summaryResult = await extractSummary(step2.tests);

            const finalOutput = {
                tests: step2.tests,
                summary: summaryResult.summary || summaryResult.error || "Summary unavailable",
                status: summaryResult.error ? "unprocessed" : "ok"
            };

            await fs.promises.unlink(tempPath);
            return res.json(finalOutput);
        } catch (err) {
            try { await fs.promises.unlink(tempPath); } catch { }
            return res.status(500).json({ error: err.message });
        }
    }
];
