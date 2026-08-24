import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing from environment variables' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are FoodWise Clinical & First Aid AI assistant.
1. When user reports a symptom without details:
   - Ask clarifying questions: What food/drink in the last 4-6 hours? What recent activity or posture?
2. When context is known or follow-up questions are asked:
   - Provide the **Suspected Condition**
   - Provide the **Recommended Doctor Specialist**
   - Provide the **Immediate First-Aid Protocol** with short numbered steps.
3. If user asks a specific follow-up (e.g., "should I see a dermatologist?"), answer directly with doctor guidance without restarting intake.
Keep all replies concise, clinically structured, and under 90 words.`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction }
    });

    return res.status(200).json({ reply: response.text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
}