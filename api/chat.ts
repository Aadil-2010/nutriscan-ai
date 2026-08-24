import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct context string for Gemini
    const systemInstruction = `You are FoodWise Clinical Assistant.
1. When user reports symptoms without details, ask for their recent food intake (4-6 hrs) and activity.
2. When context is known or questions are asked, output:
   - Suspected Condition
   - Recommended Doctor Specialist
   - Numbered Immediate First-Aid Steps.
Keep replies brief, structured, and under 90 words.`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction }
    });

    return res.status(200).json({ reply: response.text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
}