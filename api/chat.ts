import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY is not configured in environment variables.' 
    });
  }

  const systemInstruction = `You are FoodWise Clinical AI, an expert, empathetic medical triage and first-aid assistant.

INSTRUCTIONS:
1. If the user gives a casual greeting (like "hi", "hello", "hey"), greet them warmly and ask how you can assist with their symptoms, food questions, or first-aid needs.
2. If the user presents a physical symptom (e.g. swelling, numbness, rash, burns, pain):
   - **Suspected Condition**: List 2-3 most probable clinical possibilities based on the symptoms or image.
   - **Recommended Specialist**: Name the specific doctor specialist to consult.
   - **Immediate First-Aid Protocol**: Provide 3-4 clear, actionable numbered steps.
   - **Emergency Red Flags**: Point out red flags requiring immediate 911 / ER attention.
3. If an image is attached, describe what you visually observe (e.g., localized erythema, swelling, hives, lesion).
4. For follow-up questions, answer naturally in continuous context.
Keep replies clear, concise, and formatted in clean Markdown.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents = messages.map((m: any) => {
      const parts: any[] = [{ text: m.content || '' }];

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
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 600,
      },
    });

    const reply = response.text || '';
    return res.status(200).json({ reply: reply.trim() });
  } catch (err: any) {
    console.error('Chat AI Error in api/chat.ts:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to generate AI clinical response.' 
    });
  }
}