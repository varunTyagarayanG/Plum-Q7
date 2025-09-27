const axios = require("axios");
require('dotenv').config();
exports.extractSummary = async (normalizedTests) => {
    const prompt = `
You are a JSON-only generator.
Summarize the following lab tests into a patient-friendly summary.
Respond ONLY with valid JSON, no extra words.

Format:
{
  "summary": "short plain-English summary",
  "explanations": [
    "bullet point explanation 1",
    "bullet point explanation 2"
  ]
}

Tests:
${JSON.stringify(normalizedTests, null, 2)}
`;

    try {
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GenAI_API_KEY 
                },
                timeout: 30000
            }
        );

        const geminiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const match = geminiText.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);

        return { error: "Gemini returned invalid JSON", raw: geminiText };
    } catch (err) {
        return { error: err.response?.data || err.message };
    }
};
