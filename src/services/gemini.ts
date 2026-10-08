import { GoogleGenAI } from '@google/genai';

export interface MedicalExtractionResult {
  summary: string;
  diagnosed_sensitivities: string[];
  additives_to_avoid: string[];
}

export interface BarcodeVerificationResult {
  verifiedTitle: string;
  verifiedBrand: string;
  isCorrected: boolean;
}

export interface AdditiveDetail {
  ins_e_number: string;
  name: string;
  functional_class: string;
  safety_rating: 'Safe' | 'Caution' | 'High Concern' | 'High Risk';
  biological_mechanism?: string;
  description?: string;
  regulatory_status?: string;
}

export interface AllergenAlert {
  detected: boolean;
  allergen_name: string;
  warning_type: 'Safe' | 'Watch' | 'Danger';
  message: string;
}

export interface ProductAnalysisResult {
  scan_data: {
    detected_product_name: string;
    brand_name: string;
    barcode_detected: boolean;
    barcode_number: string;
    openfoodfacts_matched: boolean;
  };
  product_info: {
    total_additives_found: number;
    target_serving_size: string;
    age_group_evaluated: string;
  };
  overall_analysis: {
    health_summary: string;
    key_warnings: string[];
    toxicological_note: string;
  };
  additives_detected: AdditiveDetail[];
  allergen_alert: AllergenAlert;
}

export interface DetectedPackage {
  package_index: number;
  product_name: string;
  brand_name: string;
  variant_or_flavor: string;
  confidence: 'High' | 'Medium' | 'Low';
  detected_additives: AdditiveDetail[];
  health_summary: string;
  allergen_alerts: AllergenAlert[];
}

export interface MultiPackageScanResult {
  total_packages_detected: number;
  packages: DetectedPackage[];
}

const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash'
];

let cachedWorkingKeyIndex = 0;

export function getApiKeyPool(): string[] {
  return [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];
}

export function safeExtractJson(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI engine.');
  }

  let cleaned = rawText.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
  cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/gi, '$1').trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('AI output did not contain a readable JSON object structure.');
  }

  let extracted = cleaned.substring(firstBrace);

  // Direct parse attempt
  try {
    return JSON.parse(extracted);
  } catch (_) {
    // 1. Strip dangling unfinished key/value tokens at cut-off point
    extracted = extracted.replace(/,\s*("[^"]*"?\s*:?\s*)?$/, '');

    // 2. Count unclosed brackets and braces
    let inString = false;
    let escape = false;
    let openBraces = 0;
    let openBrackets = 0;

    for (let i = 0; i < extracted.length; i++) {
      const char = extracted[i];
      if (char === '"' && !escape) inString = !inString;
      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
      }
      escape = char === '\\' && !escape;
    }

    if (inString) extracted += '"';

    let repaired = extracted;
    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';

    try {
      return JSON.parse(repaired);
    } catch (finalErr) {
      const sanitized = repaired
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F]+/g, ' ');
      return JSON.parse(sanitized);
    }
  }
}

function isQuotaOrAuthError(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  const status = String(err?.status || '').toLowerCase();
  const code = Number(err?.code) || Number(err?.status) || 0;
  return (
    code === 429 ||
    code === 403 ||
    status === 'resource_exhausted' ||
    status === 'permission_denied' ||
    msg.includes('429') ||
    msg.includes('403') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('api_key_invalid') ||
    msg.includes('permission_denied')
  );
}

function isTransientServerError(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  const status = String(err?.status || '').toLowerCase();
  const code = Number(err?.code) || Number(err?.status) || 0;
  return (
    code === 503 ||
    code === 500 ||
    status === 'unavailable' ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('500')
  );
}

export async function generateContentWithKeyFallback(
  systemPrompt: string,
  parts: any[],
  temperature: number = 0.1,
  maxOutputTokens: number = 4000,
  enableSearch: boolean = false
): Promise<string> {
  const keyPool = getApiKeyPool();
  if (keyPool.length === 0) {
    throw new Error('No Gemini API keys configured. Please add VITE_GEMINI_API_KEY in your .env file.');
  }

  let lastError: any = null;
  const poolLen = keyPool.length;

  for (let offset = 0; offset < poolLen; offset++) {
    const currentKeyIdx = (cachedWorkingKeyIndex + offset) % poolLen;
    const activeKey = keyPool[currentKeyIdx];
    const ai = new GoogleGenAI({ apiKey: activeKey });

    for (const modelName of FALLBACK_MODELS) {
      try {
        const config: any = {
          systemInstruction: systemPrompt,
          temperature,
          maxOutputTokens,
        };

        if (enableSearch) {
          config.tools = [{ googleSearch: {} }];
        } else {
          config.responseMimeType = 'application/json';
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config,
        });

        const text = response.text || '';
        if (text.trim()) {
          cachedWorkingKeyIndex = currentKeyIdx;
          return text;
        }
      } catch (err: any) {
        lastError = err;
        if (isQuotaOrAuthError(err)) {
          break;
        }
        if (isTransientServerError(err)) {
          continue;
        }
      }
    }
  }

  throw lastError || new Error('All configured AI models and keys are currently busy. Please retry.');
}

export async function crossVerifyBarcodeWithWeb(
  barcode: string,
  rawTitle: string
): Promise<BarcodeVerificationResult> {
  const prompt = `
A barcode lookup returned: "${rawTitle}" for barcode "${barcode}".
Search Indian retail platforms (Blinkit, Zepto, BigBasket, Amazon India, GS1 India) for barcode "${barcode}".
Verify:
1. Exact commercial product and variant registered to barcode "${barcode}".
2. Real brand name and exact product title with flavor.
Return ONLY valid JSON:
{
  "verified_title": "Real Product Title and Flavor",
  "verified_brand": "Real Brand Name",
  "is_corrected": true
}
`;

  try {
    const rawText = await generateContentWithKeyFallback(
      'You are a strict Indian FMCG retail identification specialist.',
      [{ text: prompt }],
      0.1,
      800,
      true
    );
    const parsed = safeExtractJson(rawText);
    return {
      verifiedTitle: parsed.verified_title || rawTitle,
      verifiedBrand: parsed.verified_brand || '',
      isCorrected: Boolean(parsed.is_corrected),
    };
  } catch (err) {
    console.warn('Barcode web verification skipped:', err);
    return { verifiedTitle: rawTitle, verifiedBrand: '', isCorrected: false };
  }
}

export async function detectAllPackagesInFrame(
  base64Image: string,
  userAge: string = 'Adult',
  userWeight: string = '65 kg',
  sensitivities: string = 'None'
): Promise<MultiPackageScanResult> {
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeType = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

  const systemPrompt = `
You are FoodWise AI, an expert computer vision food analyst and clinical toxicologist.
SCAN THE IMAGE AND IDENTIFY VISIBLE FOOD PACKAGES:
1. Identify the exact real brand and product title.
2. Discern specific variant/flavor strictly from visible package text.
3. Extract additives with their INS/E-numbers and assign a safety rating.
4. Base allergen alerts ONLY on what the packaging indicates. Return allergen_name strictly as a plain string, never an object.
Return STRICT JSON matching this schema:
{
  "total_packages_detected": 1,
  "packages": [
    {
      "package_index": 1,
      "product_name": "Product Name",
      "brand_name": "Brand Name",
      "variant_or_flavor": "Variant / Flavor",
      "confidence": "High",
      "detected_additives": [
        {
          "ins_e_number": "INS Number",
          "name": "Additive Name",
          "functional_class": "Functional Class",
          "safety_rating": "Safe"
        }
      ],
      "health_summary": "Concise 2-sentence clinical intake evaluation.",
      "allergen_alerts": [
        {
          "allergen_name": "Trigger Name",
          "warning_type": "Safe",
          "message": "Specific clinical note."
        }
      ]
    }
  ]
}
`;

  const parts = [
    {
      inlineData: {
        data: cleanBase64,
        mimeType,
      },
    },
    { text: `Detect packages for user (${userAge}, ${userWeight}). Active sensitivities: ${sensitivities}` },
  ];

  const rawText = await generateContentWithKeyFallback(systemPrompt, parts, 0.1, 2500);
  return safeExtractJson(rawText);
}

export async function extractMedicalReportContent(
  base64Data: string,
  mimeType?: string
): Promise<MedicalExtractionResult> {
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const validMimeType =
    mimeType || (cleanBase64.startsWith('JVBERi0') ? 'application/pdf' : 'image/jpeg');

  const systemPrompt = `
You are FoodSense AI, an expert clinical dietitian and toxicologist.
Extract clinical diagnoses, allergies, food intolerances, and specific chemical food additives (INS/E-numbers) to avoid.
Only include findings explicitly confirmed in the document.
Return valid JSON:
{
  "summary": "2-3 sentence clinical summary.",
  "diagnosed_sensitivities": ["Condition 1"],
  "additives_to_avoid": ["INS 220", "INS 621"]
}
`;

  const parts = [
    {
      inlineData: {
        data: cleanBase64,
        mimeType: validMimeType,
      },
    },
    { text: 'Extract dietary sensitivities and food additive contraindications from this document.' },
  ];

  try {
    const rawText = await generateContentWithKeyFallback(systemPrompt, parts, 0.1, 1200);
    const parsed = safeExtractJson(rawText);
    return {
      summary: parsed.summary || 'Medical document analyzed and food triggers identified.',
      diagnosed_sensitivities: Array.isArray(parsed.diagnosed_sensitivities) ? parsed.diagnosed_sensitivities : [],
      additives_to_avoid: Array.isArray(parsed.additives_to_avoid) ? parsed.additives_to_avoid : [],
    };
  } catch (error: any) {
    console.error('Failed to extract medical report content:', error);
    throw new Error(error.message || 'Unable to parse medical report.');
  }
}

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
Respond in concise, readable paragraphs and bullet points. 
Do NOT output JSON or code blocks.
Evaluate questions accurately based strictly on stated ingredients.
If symptoms suggest severe allergy or anaphylaxis, advise urgent emergency care immediately (112 / local emergency).
`;

  const formattedContents = [
    ...chatHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userQuery }] },
  ];

  const poolLen = keyPool.length;

  for (let offset = 0; offset < poolLen; offset++) {
    const currentKeyIdx = (cachedWorkingKeyIndex + offset) % poolLen;
    const ai = new GoogleGenAI({ apiKey: keyPool[currentKeyIdx] });

    for (const modelName of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 800,
          },
        });

        cachedWorkingKeyIndex = currentKeyIdx;
        return response.text || 'Analysis complete. Please consult a qualified medical professional.';
      } catch (err: any) {
        if (isQuotaOrAuthError(err)) break;
        continue;
      }
    }
  }

  throw new Error('AI assistant is busy. Please try again shortly.');
}