const express = require("express");
const router = express.Router();
const extractCtrl = require("../controllers/extractController");

router.post("/extract_from_doc", extractCtrl.extractFromDoc);
router.post("/extract_minimal", extractCtrl.extractMinimal);
router.post("/extract_raw", extractCtrl.extractRaw);
router.post("/extract_normalized", extractCtrl.extractNormalized);
router.post("/extract_summary", extractCtrl.extractSummaryCtrl);
router.post("/extract_final", extractCtrl.extractFinal);

module.exports = router;
