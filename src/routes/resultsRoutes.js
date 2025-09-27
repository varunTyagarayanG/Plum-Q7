const express = require("express");
const router = express.Router();
const resultsCtrl = require("../controllers/resultsController");

router.get("/results", resultsCtrl.getAllResults);
router.get("/results/:timestamp", resultsCtrl.getResultByTimestamp);

module.exports = router;
