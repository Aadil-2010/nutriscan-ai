import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const systemInstruction = `You are FoodWise Clinical & First Aid AI assistant.
1. When user reports a symptom without details:
   - Ask clarifying questions: What food/drink in the last 4-6 hours? What recent activity or posture?
2. When context is known or follow-up questions are asked:
   - Provide the **Suspected Condition**
   - Provide the **Recommended Doctor Specialist**
   - Provide the **Immediate First-Aid Protocol** with short numbered steps.
3. If user asks a specific follow-up (e.g. should I see a dermatologist?), answer directly with doctor guidance without restarting intake.
Keep all replies concise, clinically structured, and under 90 words.`;

  // 1. Primary Engine: Official Google GenAI SDK
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction },
      });

      if (response && response.text) {
        return res.status(200).json({ reply: response.text.trim() });
      }
    } catch (sdkError) {
      console.warn('Google GenAI SDK failed, attempting backup router...', sdkError);
    }
  }

  // 2. Secondary Engine: Serverless AI Router (Guaranteed 100% uptime fallback)
  try {
    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
      })),
    ];

    const fallbackResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        model: 'openai',
        temperature: 0.3,
      }),
    });

    if (fallbackResponse.ok) {
      const fallbackText = await fallbackResponse.text();
      if (fallbackText && fallbackText.trim().length > 10) {
        return res.status(200).json({ reply: fallbackText.trim() });
      }
    }
  } catch (fallbackError) {
    console.error('All AI backends failed:', fallbackError);
  }

  return res.status(500).json({ error: 'AI generation service temporarily unavailable.' });
}