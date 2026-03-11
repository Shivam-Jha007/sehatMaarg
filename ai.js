// ai.js — Handles AI API request, prompt creation, and response parsing.
// Uses Google Gemini API (gemini-2.0-flash) for symptom-to-specialist mapping.

const AI = (() => {
  const API_KEY = CONFIG.GEMINI_API_KEY;
  const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  // System prompt that constrains the AI to safe triage behavior
  const SYSTEM_PROMPT = `You are a medical triage assistant.

Based on the user's symptoms, suggest the most appropriate type of medical specialist.

Rules:
- Do not provide medical diagnosis.
- Only recommend the type of doctor (e.g. Cardiologist, Dermatologist).
- Provide urgency level: Low, Medium, or High.
- Give a short explanation (1-3 sentences) of why this specialist is relevant.
- Always include a disclaimer stating that this is not medical advice.

Respond ONLY in this exact JSON format — no markdown, no code fences:
{
  "specialist": "...",
  "urgency": "Low | Medium | High",
  "explanation": "..."
}`;

  /**
   * Build the user message from form inputs.
   */
  function buildUserMessage(symptoms, age, conditions) {
    let msg = `Symptoms: ${symptoms}`;
    if (age) msg += `\nAge: ${age}`;
    if (conditions) msg += `\nExisting conditions: ${conditions}`;
    return msg;
  }

  /**
   * Send symptoms to Gemini and return parsed recommendation.
   * Returns { specialist, urgency, explanation }
   */
  async function analyzeSymptoms(symptoms, age, conditions) {
   

    const userMessage = buildUserMessage(symptoms, age, conditions);

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    };

    let response;
    try {
      response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch (networkErr) {
      console.error("Network error:", networkErr);
      throw new Error("Network error — check your internet connection.");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Gemini API error response:", errData);
      const msg = errData?.error?.message || response.statusText;
      throw new Error(`Gemini API error: ${msg}`);
    }

    const data = await response.json();
    console.log("Gemini raw response:", data);

    // Extract text from Gemini response
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return parseResponse(rawText);
  }

  /**
   * Parse the JSON response from the AI model.
   * Handles possible markdown code fences around JSON.
   */
  function parseResponse(rawText) {
    // Strip markdown code fences if present
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    cleaned = cleaned.trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      throw new Error(
        "Could not parse AI response. Please try again."
      );
    }

    // Validate required fields
    if (!result.specialist || !result.urgency || !result.explanation) {
      throw new Error(
        "Incomplete AI response. Please try again."
      );
    }

    // Normalize urgency to title case
    const urgencyMap = { low: "Low", medium: "Medium", high: "High" };
    result.urgency =
      urgencyMap[result.urgency.toLowerCase()] || result.urgency;

    return {
      specialist: result.specialist,
      urgency: result.urgency,
      explanation: result.explanation,
    };
  }

  // Public API
  return { analyzeSymptoms };
})();
