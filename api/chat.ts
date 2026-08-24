export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const systemInstruction = `You are FoodWise Clinical AI, an expert medical triage assistant.

DIAGNOSTIC PROTOCOL:
1. Remember and track the FULL conversation context.
2. If the user reports initial symptoms, ask for their food intake (4-6 hours) and physical activity.
3. Once the user has provided their food intake and/or activity (like snacks, sitting, exercise, etc.), synthesize EVERYTHING discussed and output:
   - **Suspected Condition**: (e.g. Acid Reflux, Food Sensitivity, Neuropathy, etc.)
   - **Recommended Doctor Specialist**: (e.g. Gastroenterologist, Allergist, Neurologist, General Physician)
   - **Immediate First-Aid Protocol**: (3-4 numbered actionable steps)
4. If the user asks a follow-up (e.g. "should I see a dermatologist?"), answer directly based on previous findings without restarting the questionnaire.
Keep your response concise, clinical, and structured.`;

  // Format history for Gemini API
  const formattedContents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '' }],
  }));

  // Direct REST call to Gemini 2.5 Flash
  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: formattedContents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 400,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ reply: data.candidates[0].content.parts[0].text.trim() });
      }
      console.error('Gemini v1 error:', JSON.stringify(data));
    } catch (err: any) {
      console.error('Gemini API fetch failed:', err.message);
    }
  }

  // Backup AI Gateway
  try {
    const chatPrompt = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
      })),
    ];

    const fallbackResp = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatPrompt,
        model: 'openai',
        temperature: 0.3,
      }),
    });

    if (fallbackResp.ok) {
      const text = await fallbackResp.text();
      if (text && text.trim().length > 10) {
        return res.status(200).json({ reply: text.trim() });
      }
    }
  } catch (e: any) {
    console.error('Gateway fallback failed:', e.message);
  }

  return res.status(500).json({ error: 'AI diagnostic engine is currently unavailable. Please verify your GEMINI_API_KEY in Vercel settings.' });
}