import { GoogleGenAI } from '@google/genai';

export interface MedicalExtractionResult {
  summary: string;
  diagnosed_sensitivities: string[];
  additives_to_avoid: string[];
}

/**
 * Fallback models prioritized by speed, performance, and stability.
 */
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.0-flash'
];

/**
 * Returns all configured Gemini API keys found in the environment.
 */
export function getApiKeyPool(): string[] {
  return [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];
}

/**
 * Robust JSON extractor that handles markdown blocks, trailing commas, 
 * control characters, and surrounding conversational text.
 */
export function safeExtractJson(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI.');
  }

  // 1. Strip Markdown code blocks
  let cleaned = rawText.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
  cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/gi, '$1').trim();

  // 2. Direct Parse Attempt
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Continue to outer brace extraction
  }

  // 3. Locate the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted);
    } catch (_) {
      // 4. Sanitize trailing commas and invalid ASCII control chars
      const sanitized = extracted
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F]+/g, ' ');
      return JSON.parse(sanitized);
    }
  }

  throw new Error('AI output did not contain a readable JSON object structure.');
}

/**
 * Helper to determine if an error is due to overload (503) or rate-limiting (429).
 */
function isTransientError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota')
  );
}

/**
 * Executes content generation with multi-key rotation and multi-model fallback on 503/429 errors.
 */
export async function generateContentWithKeyFallback(
  systemPrompt: string,
  parts: any[],
  temperature: number = 0.1,
  maxOutputTokens: number = 2500
): Promise<string> {
  const keyPool = getApiKeyPool();

  if (keyPool.length === 0) {
    throw new Error(
      'No Gemini API keys configured. Please add VITE_GEMINI_API_KEY to your .env file or Vercel settings.'
    );
  }

  let lastError: any = null;

  // Outer loop: Try all available API keys
  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const activeKey = keyPool[keyIdx];
    const ai = new GoogleGenAI({ apiKey: activeKey });

    // Inner loop: Try candidate models if upstream spikes occur
    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[Gemini Rotation] Attempting Key #${keyIdx + 1} with Model: ${modelName}...`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature,
            maxOutputTokens,
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          console.log(`[Gemini Rotation] Success with Key #${keyIdx + 1} on ${modelName}`);
          return text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Rotation] Warning on Key #${keyIdx + 1} (${modelName}):`, err.message);

        // If high-traffic spike (503) or rate limit (429), try next fallback model after brief delay
        if (isTransientError(err)) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }

        // If hard syntax/input error, break out of model loop and switch keys
        break;
      }
    }
  }

  throw (
    lastError ||
    new Error(
      'All AI models and API keys are currently experiencing high traffic (503/429). Please try again in a few moments.'
    )
  );
}

/**
 * Extracts diagnosed conditions, dietary restrictions, and additives to avoid
 * from an uploaded lab report / prescription PDF or image.
 */
export async function extractMedicalReportContent(
  base64Data: string,
  mimeType?: string
): Promise<MedicalExtractionResult> {
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const validMimeType =
    mimeType || (cleanBase64.startsWith('JVBERi0') ? 'application/pdf' : 'image/jpeg');

  const systemPrompt = `
You are FoodSense AI, an expert clinical dietitian, toxicologist, and medical record extraction specialist.
Analyze this medical document (prescription, diagnostic report, lab panel, allergy test, or discharge summary) and extract:
1. All diagnosed clinical conditions, symptoms, IgE allergies, and food intolerances.
2. Specific chemical food additives (INS/E-numbers), artificial sweeteners, preservatives, emulsifiers, synthetic dyes, or food categories the patient must avoid.
3. A clear, empathetic 2-3 sentence clinical summary of the patient's health status and dietary implications.

Return ONLY valid JSON matching this schema:
{
  "summary": "Concise 2-3 sentence clinical summary of patient findings and dietary cautions.",
  "diagnosed_sensitivities": [
    "Asthma / Sulfite Sensitivity",
    "Lactose Intolerance",
    "Hypertension"
  ],
  "additives_to_avoid": [
    "INS 220 (Sulfur Dioxide)",
    "INS 621 (Monosodium Glutamate)",
    "Artificial Sweeteners (INS 951/Aspartame)"
  ]
}
`;

  const promptText = `
Please carefully review this patient medical document.
Identify all clinical diagnoses, lab triggers, and specifically map them to food additive numbers (INS/E-codes) and allergens the patient must avoid in packaged foods.
`;

  const parts = [
    {
      inlineData: {
        data: cleanBase64,
        mimeType: validMimeType,
      },
    },
    { text: promptText },
  ];

  try {
    const rawText = await generateContentWithKeyFallback(systemPrompt, parts);
    const parsed = safeExtractJson(rawText);

    return {
      summary: parsed.summary || 'Medical document analyzed and clinical food triggers identified.',
      diagnosed_sensitivities: Array.isArray(parsed.diagnosed_sensitivities)
        ? parsed.diagnosed_sensitivities
        : [],
      additives_to_avoid: Array.isArray(parsed.additives_to_avoid)
        ? parsed.additives_to_avoid
        : [],
    };
  } catch (error: any) {
    console.error('Failed to extract medical report content:', error);
    throw new Error(
      error.message || 'Unable to parse medical report. Please verify document clarity and try again.'
    );
  }
}

/**
 * Health & First Aid Chatbot query handler with multi-key rotation and multi-model fallback.
 */
export async function askHealthChatbot(
  userQuery: string,
  chatHistory: { role: string; content: string }[],
  userContext: string
): Promise<string> {
  const keyPool = getApiKeyPool();

  if (keyPool.length === 0) {
    throw new Error('No API keys configured.');
  }

  const systemInstruction = `
You are FoodSense Health Assistant, an empathetic clinical food safety advisor.
User Health Context: ${userContext}
Provide clear, accurate guidance on food additives, allergic reactions, dietary safety, and first aid tips.
If symptoms are severe (anaphylaxis, difficulty breathing, throat swelling), immediately advise seeking emergency medical attention.
`;

  const formattedContents = [
    ...chatHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userQuery }],
    },
  ];

  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const ai = new GoogleGenAI({ apiKey: keyPool[keyIdx] });

    for (const modelName of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        });

        return response.text || 'I have analyzed your query. Please consult a physician for official clinical care.';
      } catch (err: any) {
        if (isTransientError(err)) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }
    }
  }

  throw new Error('The AI engine is currently experiencing high demand across all keys. Please try again shortly.');
}