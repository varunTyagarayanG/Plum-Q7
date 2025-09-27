const fs = require("fs");
/**
 * Copyright (c) 2025 varunTyagarayanG
 *
 * Licensed under the MIT License.
 */
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "..", "..", "results");

/**
 * GET /results
 */
exports.getAllResults = async (req, res) => {
  try {
    const files = await fs.promises.readdir(RESULTS_DIR);
    const results = files.filter(f => f.endsWith("_result.json"));
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /results/:timestamp
 */
exports.getResultByTimestamp = async (req, res) => {
  try {
    const filename = `${req.params.timestamp}_result.json`;
    const filePath = path.join(RESULTS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Result not found" });
    }
    const content = await fs.promises.readFile(filePath, "utf-8");
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
