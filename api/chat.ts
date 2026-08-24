export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const systemInstruction = `You are FoodWise Clinical Assistant, an expert medical triage AI.

CORE CLINICAL RULES:
1. ALWAYS prioritize the primary physical symptom reported (e.g., swollen hand, hives, headache, breathing difficulty) over incidental details like snacks or foods eaten.
2. Maintain full conversational context. If a user reported a swollen hand and later mentions eating chips, evaluate whether the hand swelling is an allergic reaction (angioedema), insect bite, injury, or fluid retention—DO NOT blindly diagnose stomach issues just because food was mentioned.
3. OUTPUT FORMAT:
   - **Suspected Condition**: State the primary condition matching the physical symptom.
   - **Recommended Doctor Specialist**: State the exact specialist (e.g., Allergist, Orthopedist, Neurologist, Dermatologist, ER).
   - **Immediate First-Aid Protocol**: Provide 3-4 numbered, actionable immediate steps specific to the real physical complaint.
4. Keep the output clean, structured, and clinically sound.`;

  // 1. Primary AI Tier: Gemini API (if key available)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }],
      }));

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: formattedContents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
        }),
      });

      if (geminiResp.ok) {
        const data = await geminiResp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return res.status(200).json({ reply: text.trim() });
        }
      }
    } catch (e) {
      console.warn('Gemini endpoint error, falling back to router...');
    }
  }

  // 2. High-Availability Zero-Key AI Router
  try {
    const chatPayload = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
      })),
    ];

    const aiResp = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatPayload,
        model: 'openai',
        temperature: 0.2,
      }),
    });

    if (aiResp.ok) {
      const text = await aiResp.text();
      if (text && text.trim().length > 10) {
        return res.status(200).json({ reply: text.trim() });
      }
    }
  } catch (err: any) {
    console.error('All AI endpoints failed:', err);
  }

  return res.status(500).json({ error: 'Clinical AI service temporarily busy. Please try sending again in a moment.' });
}