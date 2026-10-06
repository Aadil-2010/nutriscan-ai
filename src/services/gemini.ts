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

export interface DetectedPackage {
  package_index: number;
  product_name: string;
  brand_name: string;
  variant_or_flavor: string;
  confidence: 'High' | 'Medium' | 'Low';
  detected_additives: {
    ins_e_number: string;
    name: string;
    functional_class: string;
    safety_rating: 'Safe' | 'Caution' | 'High Risk';
  }[];
  health_summary: string;
  allergen_alerts: string[];
}

export interface MultiPackageScanResult {
  total_packages_detected: number;
  packages: DetectedPackage[];
}

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

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
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted);
    } catch (_) {
      const sanitized = extracted
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F]+/g, ' ');
      return JSON.parse(sanitized);
    }
  }

  throw new Error('AI output did not contain a readable JSON object structure.');
}

function isQuotaOrAuthError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('403') ||
    msg.includes('api_key_invalid') ||
    msg.includes('permission_denied')
  );
}

function isTransientServerError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('500')
  );
}

export async function generateContentWithKeyFallback(
  systemPrompt: string,
  parts: any[],
  temperature: number = 0.1,
  maxOutputTokens: number = 2200,
  enableSearch: boolean = false
): Promise<string> {
  const keyPool = getApiKeyPool();

  if (keyPool.length === 0) {
    throw new Error('No Gemini API keys configured. Please add VITE_GEMINI_API_KEY in your .env file.');
  }

  let lastError: any = null;

  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const activeKey = keyPool[keyIdx];
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
          return text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Key #${keyIdx + 1} with ${modelName} encountered an error:`, err.message);

        if (isQuotaOrAuthError(err)) {
          break;
        }

        if (isTransientServerError(err)) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        continue;
      }
    }
  }

  throw lastError || new Error('All AI models and API keys failed.');
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

Scan the ENTIRE provided image and detect ALL distinct food/beverage packages visible (e.g. snack wrappers, biscuit packets, cereal boxes, wafers, drinks).

For EACH package detected:
1. Identify the exact real brand and product title (e.g. "Parle Hide & Seek", "Nestlé Munch Crunchilicious", "Dukes Waffy Orange").
2. Identify flavor and variant accurately from packaging text/graphics.
3. Extract probable/stated INS additives and allergen alerts.
4. Provide a clinical health summary tailored to user age (${userAge}) and weight (${userWeight}).

Return STRICT JSON matching this schema:
{
  "total_packages_detected": 1,
  "packages": [
    {
      "package_index": 1,
      "product_name": "Full Product Name",
      "brand_name": "Brand Name",
      "variant_or_flavor": "Flavor / Variant",
      "confidence": "High",
      "detected_additives": [
        {
          "ins_e_number": "INS 110",
          "name": "Sunset Yellow FCF",
          "functional_class": "Synthetic Food Colour",
          "safety_rating": "Caution"
        }
      ],
      "health_summary": "2-sentence clinical intake evaluation.",
      "allergen_alerts": ["Wheat (Gluten)", "Soy"]
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
    { text: 'Identify all food packages visible in this image.' },
  ];

  const rawText = await generateContentWithKeyFallback(systemPrompt, parts, 0.1, 2500);
  return safeExtractJson(rawText);
}

export async function crossVerifyBarcodeWithWeb(
  barcode: string,
  rawTitle: string
): Promise<BarcodeVerificationResult> {
  const prompt = `
A barcode lookup returned: "${rawTitle}" for barcode "${barcode}".
Search Indian retail platforms (Blinkit, Zepto, BigBasket, Amazon India, GS1 India) for barcode "${barcode}".

Verify:
1. What exact commercial product and variant is registered to barcode "${barcode}"?
2. What is the real brand name and exact product title with flavor?

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
      600,
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
        mimeType,
      },
    },
    { text: 'Extract dietary sensitivities and food additive contraindications from this document.' },
  ];

  try {
    const rawText = await generateContentWithKeyFallback(systemPrompt, parts);
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
Provide direct guidance on food additives, allergens, and dietary safety.
If symptoms suggest severe allergy or anaphylaxis, advise urgent emergency care immediately.
`;

  const formattedContents = [
    ...chatHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userQuery }] },
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

        return response.text || 'Analysis complete. Please consult a doctor for official guidance.';
      } catch (err: any) {
        if (isQuotaOrAuthError(err)) break;
        continue;
      }
    }
  }

  throw new Error('AI engine busy. Please try again in a few moments.');
}