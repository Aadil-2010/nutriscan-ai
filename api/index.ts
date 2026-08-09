import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// High body size limit for base64 camera image uploads
app.use(express.json({ limit: '20mb' }));

// Lazy initializer for GoogleGenAI
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
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System instruction matching the exact FoodWise AI operational specifications
const SYSTEM_INSTRUCTION = `You are FoodWise AI, an intelligent, scientific food label interpreter and additive safety analyzer.

SCIENTIFIC GUIDELINES & ETHICAL FRAMEWORK:
1. Personalised Food Suitability Score:
   - Do NOT classify foods as simply "good" or "bad". Calculate a "Personalised Food Suitability Score" (0-100) based on user profile, nutritional context, portion size, and restrictions.
2. Allergen Safety & Cross-Contamination:
   - You DO NOT diagnose medical conditions or allergies.
   - Strictly identify if a product "contains" or "may contain traces of" a known allergen (e.g., peanuts, milk, gluten, sulfites).
   - Flag cross-contamination warnings ("may contain") prominently as critical alerts.
3. Objective Guidance & Standards:
   - Frame health risks using established toxicological standards (NOAEL, ADI) and regulatory limits (FSSAI, FDA, EFSA). Avoid sensationalizing safe additives.

OPERATIONAL BEHAVIOR & OCR RULES:
1. Barcode Recognition & Processing:
   - When an image contains a barcode (UPC, EAN-13, EAN-8, QR code): Identify and extract the numerical digit sequence.
2. Label OCR & Text Processing:
   - Perform line-by-line OCR on label images to extract ingredients, additives (INS/E-numbers), and allergen statements.
3. Direct Product Name Search:
   - When only a product name (e.g., "Lays Classic", "Coca-Cola Original", "Doritos") is provided without an explicit ingredient list, identify the commercial food product from knowledge base, deduce its standard ingredient composition, and evaluate all additives/allergens accordingly.
4. Biological & Functional Mapping:
   - Map additives to functional classes (Preservative, Antioxidant, Emulsifier, Synthetic Dye).
   - Differentiate IgE-mediated allergies from non-IgE chemical sensitivities (e.g., sulfites triggering airway constriction in asthmatics).

OUTPUT SCHEMA (JSON ONLY):
You MUST reply with valid JSON matching the exact structure below:

{
  "scan_data": {
    "barcode_detected": false,
    "barcode_number": null,
    "detected_product_name": "Product Name or 'Unknown Product'"
  },
  "personalised_suitability_score": 78,
  "suitability_breakdown": [
    { "category": "Nutritional Quality", "result": "Good", "indicator": "🟢" },
    { "category": "Added Sugar", "result": "Moderate", "indicator": "🟡" },
    { "category": "Sodium", "result": "Low", "indicator": "🟢" },
    { "category": "Saturated Fat", "result": "Moderate", "indicator": "🟡" },
    { "category": "Fibre", "result": "Good", "indicator": "🟢" },
    { "category": "Allergens", "result": "Contains Milk / May contain traces of peanuts", "indicator": "🔴" },
    { "category": "Additives", "result": "Present", "indicator": "🟡" }
  ],
  "allergen_alert": {
    "detected": true,
    "allergen_name": "Peanuts / Milk",
    "warning_type": "Direct Ingredient or Traces Warning",
    "message": "ALLERGEN ALERT: Known allergen or trace warning detected. Avoid this product and verify physical packaging."
  },
  "additives_detected": [
    {
      "name": "Additive Name",
      "ins_e_number": "E-Number or INS Code",
      "functional_class": "Preservative / Antioxidant / Emulsifier / Synthetic Dye / Other",
      "biological_mechanism": "IgE-Mediated Allergy / Non-IgE Chemical Sensitivity / Gut Microbiota Disruption / None",
      "regulatory_status": "FSSAI, FDA, and EFSA approval context",
      "safety_rating": "Safe / Caution / High Concern",
      "description": "Clear explanation of what this additive is and why it's used."
    }
  ],
  "overall_analysis": {
    "health_summary": "High-level summary of product suitability based on ingredients.",
    "key_warnings": [
      "Critical allergen or sensitivity warnings"
    ],
    "toxicological_note": "ADI threshold reminder."
  }
}`;

// OpenFoodFacts API Lookup Helper
async function fetchOpenFoodFactsProduct(barcode: string) {
  const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
  if (!cleanBarcode || cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    return null;
  }

  const endpoints = [
    `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    `https://in.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'NutriScanAI - WebApp - Version 1.0 - www.nutriscan.ai',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && (data.status === 1 || data.product)) {
          const p = data.product || {};
          const productName = p.product_name_en || p.product_name || p.product_name_fr || p.brands || `Product (${cleanBarcode})`;
          const ingredientsText = p.ingredients_text_en || p.ingredients_text || p.ingredients_text_with_allergens || '';
          const additivesTags = p.additives_tags || p.additives_original_tags || [];
          const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || null;
          const brands = p.brands || p.brand_owner || '';
          const categories = p.categories || p.categories_en || '';

          return {
            barcode: cleanBarcode,
            productName,
            brands,
            categories,
            ingredientsText,
            additivesTags,
            imageUrl,
          };
        }
      }
    } catch (err) {
      console.warn(`OpenFoodFacts fetch failed for URL ${url}:`, err);
    }
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Dedicated Barcode Search endpoint
app.get('/api/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const offData = await fetchOpenFoodFactsProduct(code);
    if (!offData) {
      return res.status(404).json({ error: `Barcode ${code} not found in OpenFoodFacts database.` });
    }
    return res.json(offData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to query barcode.' });
  }
});

// Health Report & Symptoms AI Analysis endpoint
app.post('/api/analyze-health-report', async (req, res) => {
  try {
    const { symptoms, reportFile, mimeType, fileName } = req.body;

    if (!symptoms && !reportFile) {
      return res.status(400).json({ error: 'Please enter health symptoms or upload a medical report PDF/image.' });
    }

    const ai = getGeminiClient();
    let contentsParts: any[] = [];

    if (reportFile) {
      let fileMime = mimeType || 'application/pdf';
      let base64Data = reportFile;

      if (reportFile.startsWith('data:')) {
        const matches = reportFile.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          fileMime = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = reportFile.replace(/^data:[^;]+;base64,/, '');
        }
      }

      contentsParts.push({
        inlineData: {
          mimeType: fileMime,
          data: base64Data,
        }
      });
    }

    const promptText = `You are an expert clinical toxicology and medical report AI analyzer for NutriScan AI.
Examine the user's uploaded medical report file (PDF / lab diagnostic image) and listed health symptoms to extract clinical diagnoses, food additive sensitivities, allergens, and specific INS/E-numbers to avoid.

USER REPORTED SYMPTOMS: "${symptoms || 'None specified, extract diagnosis directly from attached medical report.'}"
ATTACHED MEDICAL REPORT FILE: ${fileName || 'Medical/Lab Diagnostic Report'}

Analyze all lab parameters, IgE antibody titers, metabolic notes, or reported symptoms.
Produce ONLY a valid JSON object matching this exact schema:
{
  "patient_summary": "Concise 2-3 sentence clinical summary of the user's condition and key lab findings.",
  "diagnosed_sensitivities": ["List of identified sensitivities/allergies, e.g. Sulfite Intolerance, IgE Tartrazine Sensitivity, Histamine Intolerance, IBS/Gut Dysbiosis"],
  "additives_to_avoid": [
    {
      "ins_e_number": "E220 - E228 / INS 220-228",
      "name": "Sulfites & Metabisulfites",
      "reason": "Triggers airway bronchospasm in asthmatic/sulfite sensitive individuals."
    }
  ],
  "suggested_preferences": {
    "asthmaSulfiteAlert": true,
    "gutHealthFocus": true,
    "kidsSafetyFocus": false,
    "fssaiIndiaFocus": true,
    "igeAllergyProne": true
  },
  "dietary_recommendations": [
    "Specific practical food safety guidance based on the report."
  ],
  "medical_disclaimer": "This AI summary is for consumer educational reference and should be reviewed with your medical provider."
}`;

    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse medical report AI output.');
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/analyze-health-report:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze medical report.' });
  }
});

// Analyze route
app.post('/api/analyze', async (req, res) => {
  try {
    const { productName, ingredients, image, barcodeInput, userPreferences, healthProfile } = req.body;

    if (!productName?.trim() && !ingredients?.trim() && !image && !barcodeInput?.trim()) {
      return res.status(400).json({ error: 'Please provide a product name, ingredient text, barcode number, or label image.' });
    }

    let effectiveBarcode = barcodeInput ? barcodeInput.trim() : '';
    if (!effectiveBarcode && ingredients) {
      const trimmed = ingredients.trim();
      if (/^\d{8,14}$/.test(trimmed)) {
        effectiveBarcode = trimmed;
      }
    }

    let offData: any = null;
    if (effectiveBarcode) {
      offData = await fetchOpenFoodFactsProduct(effectiveBarcode);
    }

    const ai = getGeminiClient();
    let contentsParts: any[] = [];

    // Shared health context string scoping fix
    let healthContextStr = '';
    if (healthProfile) {
      healthContextStr = `\nUSER CLINICAL MEDICAL PROFILE & SYMPTOMS:
User Symptoms: "${healthProfile.symptoms || 'None specified'}"
Diagnosed Sensitivities: ${JSON.stringify(healthProfile.medicalReportAnalysis?.diagnosed_sensitivities || [])}
Additives To Avoid From Lab Report: ${JSON.stringify(healthProfile.medicalReportAnalysis?.additives_to_avoid || [])}
CRITICAL INSTRUCTION: If any ingredient/additive in this food product conflicts with the user's uploaded medical report or reported symptoms, add an explicit HIGH RISK warning in overall_analysis.key_warnings and mark that additive's safety_rating as "High Concern".`;
    }

    if (image) {
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        }
      }

      contentsParts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });

      let promptText = `Examine this image for barcodes (UPC, EAN-13, EAN-8, QR codes) and food label ingredient text.`;
      if (productName) promptText += ` Target Product Name: "${productName}".`;
      if (offData) {
        promptText += `\nOPENFOODFACTS VERIFIED PRODUCT MATCH FOUND:
Barcode GTIN: ${offData.barcode}
Product Name: ${offData.productName}
Brand: ${offData.brands || 'N/A'}
Categories: ${offData.categories || 'N/A'}
Verified Ingredients from OpenFoodFacts: "${offData.ingredientsText || 'N/A'}"
Known Additive Tags from OpenFoodFacts: ${JSON.stringify(offData.additivesTags)}`;
      } else if (effectiveBarcode) {
        promptText += ` User specified barcode number: ${effectiveBarcode}.`;
      }
      if (ingredients) promptText += ` Additional user provided text: "${ingredients}".`;
      promptText += `\nUser health sensitivities context: ${JSON.stringify(userPreferences || {})}.${healthContextStr}
Perform OCR, barcode identification, additive classification, and produce the required JSON analysis matching the schema.
${offData ? `Crucial: In "scan_data", set "barcode_detected": true, "barcode_number": "${offData.barcode}", "detected_product_name": "${offData.productName}", "openfoodfacts_matched": true, "brand_name": "${offData.brands}".` : ''}`;

      contentsParts.push({ text: promptText });
    } else {
      let promptText = `Analyze the food product input according to NutriScan AI knowledge base.`;
      if (productName?.trim()) {
        promptText += `\nTarget Food Product Name: "${productName.trim()}". (If explicit ingredient text is missing, evaluate this product based on its standard known commercial ingredients and food additives).`;
      }
      if (offData) {
        promptText += `\nOPENFOODFACTS DATABASE VERIFIED MATCH:
Barcode GTIN: ${offData.barcode}
Product Name: ${offData.productName}
Brand: ${offData.brands || 'N/A'}
Categories: ${offData.categories || 'N/A'}
Ingredients Text from OpenFoodFacts: "${offData.ingredientsText || 'N/A'}"
Additives Tags from OpenFoodFacts: ${JSON.stringify(offData.additivesTags)}
`;
      } else if (effectiveBarcode) {
        promptText += ` Barcode number provided: ${effectiveBarcode}.`;
      }
      if (ingredients && ingredients !== effectiveBarcode) {
        promptText += ` Ingredients text provided: "${ingredients}".`;
      }
      promptText += `\nUser health sensitivities context: ${JSON.stringify(userPreferences || {})}.${healthContextStr}
Extract every single food additive, map its INS/E-number, functional class, biological mechanism (IgE vs Non-IgE), regulatory status (FSSAI/FDA/EFSA), safety rating, and produce the structured JSON output.
${offData ? `Crucial: In "scan_data", set "barcode_detected": true, "barcode_number": "${offData.barcode}", "detected_product_name": "${offData.productName}", "openfoodfacts_matched": true, "brand_name": "${offData.brands}".` : ''}`;

      contentsParts.push({ text: promptText });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid response format received from AI model.');
      }
    }

    if (offData) {
      if (parsedData.scan_data) {
        parsedData.scan_data.barcode_detected = true;
        parsedData.scan_data.barcode_number = offData.barcode;
        parsedData.scan_data.openfoodfacts_matched = true;
        parsedData.scan_data.brand_name = offData.brands || parsedData.scan_data.brand_name;
        if (offData.productName && (!parsedData.scan_data.detected_product_name || parsedData.scan_data.detected_product_name === 'Unknown Product')) {
          parsedData.scan_data.detected_product_name = offData.productName;
        }
      }
      if (offData.imageUrl) {
        parsedData.off_image_url = offData.imageUrl;
      }
    } else if (productName && parsedData.scan_data && (!parsedData.scan_data.detected_product_name || parsedData.scan_data.detected_product_name === 'Unknown Product')) {
      parsedData.scan_data.detected_product_name = productName;
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during food additive analysis.',
    });
  }
});

// Run local listener only when developing locally (outside Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening locally on http://localhost:${PORT}`);
  });
}

export default app;