/**
 * Copyright (c) 2025 varunTyagarayanG
 *
 * Licensed under the MIT License.
 */
const express = require("express");
const extractRoutes = require("./routes/extractRoutes");
const resultsRoutes = require("./routes/resultsRoutes");

const app = express();
app.use(express.json());

// mount routes
app.use("/", extractRoutes);
app.use("/", resultsRoutes);

module.exports = app;
