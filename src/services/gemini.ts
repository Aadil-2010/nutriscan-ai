import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
});

export interface MedicalExtractionResult {
  summary: string;
  diagnosed_sensitivities: string[];
  additives_to_avoid: string[];
}

export async function extractMedicalReportContent(
  base64Data: string,
  mimeType: string
): Promise<MedicalExtractionResult> {
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const validMimeType = mimeType || (cleanBase64.startsWith('JVBERi0') ? 'application/pdf' : 'image/jpeg');

  const prompt = `
You are an expert clinical dietitian and medical record analyzer.
Read this medical document/PDF and extract:
1. All diagnosed clinical conditions, health issues, allergies, and food sensitivities.
2. Specific ingredients, chemical additives, preservatives, artificial sweeteners, or food categories the patient must avoid.
3. A clear 2-3 sentence clinical summary of the patient's health status.

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Concise summary of findings",
  "diagnosed_sensitivities": ["Condition/Allergy 1", "Condition/Allergy 2"],
  "additives_to_avoid": ["Additive/Ingredient 1", "Additive/Ingredient 2"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: validMimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const sanitizedText = rawText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(sanitizedText || '{}');

    return {
      summary: parsed.summary || 'Document reviewed and active medical triggers identified.',
      diagnosed_sensitivities: Array.isArray(parsed.diagnosed_sensitivities) ? parsed.diagnosed_sensitivities : [],
      additives_to_avoid: Array.isArray(parsed.additives_to_avoid) ? parsed.additives_to_avoid : [],
    };
  } catch (error) {
    console.error('Gemini medical extraction error:', error);
    throw error;
  }
}