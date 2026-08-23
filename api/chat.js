import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are FoodWise AI Health & First Aid Assistant. 
Provide concise, clear, and actionable advice for dietary queries, ingredient safety, and first-aid protocols. 
Use bullet points and bold highlights for critical actions.
If the query is a simple greeting, reply warmly and introduce what you can assist with.
Always include a short safety reminder if life-threatening symptoms are mentioned.

User query: ${message}`,
            },
          ],
        },
      ],
    });

    const reply = response.text || 'I could not generate a response. Please try again.';
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}