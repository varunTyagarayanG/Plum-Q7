/**
 * Copyright (c) 2025 varunTyagarayanG
 *
 * Licensed under the MIT License.
 */
const app = require("./app");

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
