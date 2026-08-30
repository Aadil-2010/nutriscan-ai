import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge', // or nodejs
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { productName, ingredients, barcodeInput, image, userPreferences, healthProfile } = await req.json();

    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing Gemini API Key in environment variables' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
You are an expert food additive toxicologist, clinical nutritionist, and regulatory food safety assessor (EFSA, US FDA, FSSAI India).

Analyze the submitted food product, ingredients list, barcode data, or label image.
Screen against the patient's active health profile and preferences:
- Patient Active Symptoms/Sensitivities: ${healthProfile?.symptoms || 'None'}
- Medical Reports Summary: ${healthProfile?.medicalReportAnalysis?.summary || 'None'}
- Active Preference Flags: ${JSON.stringify(userPreferences || {})}

Extract all ingredients, identify additive codes (E-numbers / INS numbers), determine functional classes, evaluate allergen cross-contamination, detect contraindications, and provide a personalised food suitability score (0 to 100).

Respond ONLY with valid JSON matching this schema:
{
  "product_name": "Identified product name",
  "suitability_score": 85,
  "suitability_level": "Safe" | "Caution" | "Avoid",
  "summary": "2-3 sentence clinical dietary summary",
  "allergen_alert": {
    "detected": true/false,
    "allergen_name": "Name of allergen if detected",
    "warning_type": "Direct Ingredient / Cross-Contamination Warning",
    "message": "Clinical warning message"
  },
  "additives": [
    {
      "code": "E621 / INS 621",
      "name": "Monosodium Glutamate",
      "functional_class": "Flavor Enhancer",
      "safety_rating": "Caution",
      "description": "Short description and health impact.",
      "adi_limit": "30 mg/kg bw",
      "regulatory_status": "Approved by FSSAI, FDA, EFSA"
    }
  ],
  "dietary_flags": ["High Sodium", "Preservatives Flagged"],
  "health_guidelines": ["Clinical recommendation 1", "Recommendation 2"]
}
`;

    const parts: any[] = [];
    if (image) {
      const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
      const mimeType = cleanBase64.startsWith('JVBERi0') ? 'application/pdf' : 'image/jpeg';
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      });
    }

    const textQuery = `
Product Name: ${productName || 'N/A'}
Barcode: ${barcodeInput || 'N/A'}
Ingredients: ${ingredients || 'Read from attached image'}
`;
    parts.push({ text: textQuery });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const sanitizedText = rawText.replace(/```json\n?|```/g, '').trim();
    const parsedData = JSON.parse(sanitizedText);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('API Analyze Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}