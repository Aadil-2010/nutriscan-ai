import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));

// CORS headers for preflight and local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are FoodWise AI, an intelligent, scientific food label interpreter and additive safety analyzer.

SCIENTIFIC GUIDELINES & ETHICAL FRAMEWORK:
1. Personalised Food Suitability Score:
   - Calculate a "Personalised Food Suitability Score" (0-100) based on user profile, nutritional context, portion size, and restrictions.
2. Allergen Safety & Cross-Contamination:
   - Do NOT diagnose medical conditions. Identify if a product "contains" or "may contain traces of" allergens.
3. Objective Guidance & Standards:
   - Frame health risks using established standards (NOAEL, ADI) and regulatory limits (FSSAI, FDA, EFSA).

OPERATIONAL BEHAVIOR:
1. Product Name Priority:
   - When a specific Product Name (e.g., "Horlicks", "Lay's Spanish Tomato Tango") is provided, evaluate that EXACT product's commercial recipe. Ignore conflicting database entries or GTIN prefix overlaps.
2. Additive Mapping:
   - Map additives to functional classes, biological mechanisms (IgE vs Non-IgE), and regulatory status.

OUTPUT SCHEMA (JSON ONLY):
{
  "scan_data": {
    "barcode_detected": false,
    "barcode_number": null,
    "detected_product_name": "Product Name"
  },
  "personalised_suitability_score": 78,
  "suitability_breakdown": [
    { "category": "Nutritional Quality", "result": "Good", "indicator": "🟢" },
    { "category": "Additives", "result": "Present", "indicator": "🟡" }
  ],
  "allergen_alert": {
    "detected": false,
    "allergen_name": "",
    "warning_type": "",
    "message": ""
  },
  "additives_detected": [
    {
      "name": "Additive Name",
      "ins_e_number": "INS / E-Number",
      "functional_class": "Preservative / Antioxidant / Emulsifier / Synthetic Dye / Other",
      "biological_mechanism": "IgE-Mediated Allergy / Non-IgE Chemical Sensitivity / Gut Microbiota Disruption / None",
      "regulatory_status": "FSSAI, FDA, EFSA context",
      "safety_rating": "Safe / Caution / High Concern",
      "description": "Explanation of additive purpose and health context."
    }
  ],
  "overall_analysis": {
    "health_summary": "Summary based on ingredients.",
    "key_warnings": [],
    "toxicological_note": "ADI threshold note."
  }
}`;

const CHAT_SYSTEM_INSTRUCTION = `You are FoodWise Clinical Assistant, an expert medical triage & first-aid AI.

CLINICAL INSTRUCTIONS:
1. When the user reports ANY symptom (e.g. headache, swelling, numbness, rash, chest pain, nausea, injury) or uploads a photo:
   - **Suspected Condition**: 2-3 most probable clinical etiologies.
   - **Recommended Specialist**: Exact doctor specialist (e.g., Neurologist, Allergist, ENT, Dermatologist, Orthopedist).
   - **Immediate First-Aid Protocol**: 3-4 concise, numbered, actionable steps.
   - **Red-Flag Emergency Triggers**: Clear criteria for seeking immediate emergency care (911 / 112 / ER).
2. If the user provides a casual greeting (e.g. "hi"), greet them politely and invite them to share their symptom.
3. If an image is provided, comment directly on observable signs (erythema, localized edema, hives, wound).
4. For follow-up questions, answer directly in continuous context.
Keep replies direct, clinically sound, and formatted in clean Markdown.`;

async function fetchOpenFoodFactsProduct(barcode: string) {
  const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
  if (!cleanBarcode || cleanBarcode.length < 8 || cleanBarcode.length > 14) return null;

  const endpoints = [
    `https://in.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
  ];

  for (const url of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'NutriScanAI - WebApp' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 1 && data.product) {
          const p = data.product;
          const productName = p.product_name_en || p.product_name || p.brands || '';
          const ingredientsText = p.ingredients_text_en || p.ingredients_text || p.ingredients_text_with_allergens || '';

          if (productName.trim() || ingredientsText.trim()) {
            return {
              barcode: cleanBarcode,
              productName: productName || `GTIN ${cleanBarcode}`,
              brands: p.brands || p.brand_owner || '',
              ingredientsText,
              additivesTags: p.additives_tags || [],
              imageUrl: p.image_front_url || p.image_url || null,
            };
          }
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const offData = await fetchOpenFoodFactsProduct(code);
    if (!offData) {
      return res.status(404).json({ error: `Barcode ${code} not found.` });
    }
    return res.json(offData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to query barcode.' });
  }
});

app.post('/api/analyze-health-report', async (req, res) => {
  try {
    const { symptoms, reportFile, mimeType, fileName } = req.body;
    if (!symptoms && !reportFile) {
      return res.status(400).json({ error: 'Please enter health symptoms or upload a medical report.' });
    }

    const ai = getGeminiClient();
    let contentsParts: any[] = [];

    if (reportFile) {
      let fileMime = mimeType || 'application/pdf';
      let base64Data = reportFile.replace(/^data:[^;]+;base64,/, '');
      contentsParts.push({ inlineData: { mimeType: fileMime, data: base64Data } });
    }

    const promptText = `Analyze clinical medical report and symptoms for NutriScan AI.
USER SYMPTOMS: "${symptoms || 'None specified'}"
REPORT FILE: ${fileName || 'Medical Report'}

Extract diagnoses and additives to avoid. Reply in JSON matching expected schema.`;

    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contentsParts },
      config: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Health report error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze health report.' });
  }
});

// Real-Time Chat & Multimodal Symptom Triage Route
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const ai = getGeminiClient();

    const contents = messages.map((m: any) => {
      const parts: any[] = [];

      if (m.content) {
        parts.push({ text: m.content });
      }

      if (m.image && typeof m.image === 'string' && m.image.includes(',')) {
        const mimeType = m.image.split(';')[0].replace('data:', '') || 'image/jpeg';
        const base64Data = m.image.split(',')[1];
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    const reply = response.text || '';
    return res.json({ reply: reply.trim() });
  } catch (error: any) {
    console.error('Chat error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to process chat request.' });
  }
});

// Ingredient & Product Safety Scanner Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { productName, ingredients, image, barcodeInput, userPreferences, healthProfile } = req.body;

    if (!productName?.trim() && !ingredients?.trim() && !image && !barcodeInput?.trim()) {
      return res.status(400).json({ error: 'Please provide a product name, ingredient text, barcode number, or label image.' });
    }

    let effectiveBarcode = barcodeInput?.trim() || '';
    if (!effectiveBarcode && ingredients && /^\d{8,14}$/.test(ingredients.trim())) {
      effectiveBarcode = ingredients.trim();
    }

    let offData: any = null;
    if (effectiveBarcode && !productName?.trim()) {
      offData = await fetchOpenFoodFactsProduct(effectiveBarcode);
    }

    const ai = getGeminiClient();
    let contentsParts: any[] = [];

    // Synthesize full medical profile and all multi-reports
    let healthContextStr = '';
    if (healthProfile) {
      let reportsSummary = 'None attached';
      if (Array.isArray(healthProfile.medicalReports) && healthProfile.medicalReports.length > 0) {
        reportsSummary = healthProfile.medicalReports
          .map((r: any, idx: number) => `[Report ${idx + 1} - ${r.category || 'Clinical'} (${r.reportDate || 'N/A'})] ${r.title}: ${r.reportText}`)
          .join('\n');
      }

      healthContextStr = `\nUSER MEDICAL PROFILE:
Symptoms: "${healthProfile.symptoms || 'None'}"
Saved Diagnostic Lab Reports:
${reportsSummary}
Sensitivities: ${JSON.stringify(healthProfile.medicalReportAnalysis?.diagnosed_sensitivities || [])}
Additives to Avoid: ${JSON.stringify(healthProfile.medicalReportAnalysis?.additives_to_avoid || [])}`;
    }

    let promptText = `Analyze the food product input for NutriScan AI.`;

    if (productName?.trim()) {
      promptText += `\nTARGET PRODUCT NAME: "${productName.trim()}". You MUST evaluate this exact commercial food product and its real recipe. Ignore any conflicting GTIN database records.`;
    }

    if (offData && !productName?.trim()) {
      promptText += `\nOPENFOODFACTS MATCH:
GTIN: ${offData.barcode}
Product: ${offData.productName}
Ingredients: "${offData.ingredientsText || 'N/A'}"`;
    } else if (effectiveBarcode) {
      promptText += `\nBARCODE GTIN: ${effectiveBarcode}. Analyze the standard commercial product associated with this barcode.`;
    }

    if (ingredients && ingredients !== effectiveBarcode) {
      promptText += `\nINGREDIENTS LIST: "${ingredients}".`;
    }

    promptText += `\nUser Preferences: ${JSON.stringify(userPreferences || {})}.${healthContextStr}`;

    if (image) {
      let base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      contentsParts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
    }
    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contentsParts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    let parsedData = JSON.parse(responseText);

    if (offData && !productName?.trim()) {
      if (parsedData.scan_data) {
        parsedData.scan_data.barcode_detected = true;
        parsedData.scan_data.barcode_number = offData.barcode;
        parsedData.scan_data.openfoodfacts_matched = true;
        parsedData.scan_data.brand_name = offData.brands || parsedData.scan_data.brand_name;
        if (offData.productName) {
          parsedData.scan_data.detected_product_name = offData.productName;
        }
      }
      if (offData.imageUrl) {
        parsedData.off_image_url = offData.imageUrl;
      }
    }

    if (productName?.trim() && parsedData.scan_data) {
      parsedData.scan_data.detected_product_name = productName.trim();
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during food additive analysis.',
    });
  }
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening locally on http://localhost:${PORT}`);
  });
}

export default app;