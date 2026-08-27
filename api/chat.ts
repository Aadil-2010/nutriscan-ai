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

  const systemInstruction = `You are FoodWise Clinical AI, an expert medical triage assistant.

INSTRUCTIONS:
1. If the user gives a casual greeting (like "hi", "hello"), greet them warmly and ask about their symptoms or health questions.
2. If the user reports a physical symptom (e.g. swelling, numbness, rash, pain, burns):
   - **Suspected Condition**: List 2-3 most probable clinical possibilities.
   - **Recommended Specialist**: Name the specific doctor specialist (e.g. Neurologist, Allergist, Dermatologist, Orthopedist).
   - **Immediate First-Aid Protocol**: Provide 3-4 clear, actionable numbered steps.
   - **Emergency Red Flags**: Point out when to seek immediate emergency care.
3. If an image is provided, comment on what is visually observable.
4. For follow-up questions, answer naturally in context.
Keep replies clear, compassionate, and formatted in Markdown.`;

  if (apiKey) {
    try {
      const contents = messages.map((m: any) => {
        const parts: any[] = [{ text: m.content || '' }];

        if (m.image && typeof m.image === 'string' && m.image.includes(',')) {
          const mimeType = m.image.split(';')[0].replace('data:', '') || 'image/jpeg';
          const base64Data = m.image.split(',')[1];
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          });
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

      // Standard Gemini 2.0 / 1.5 Flash endpoint
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim().length > 0) {
          return res.status(200).json({ reply: reply.trim() });
        }
      }
    } catch (e) {
      console.warn('Backend Gemini API call failed:', e);
    }
  }

  // Backup zero-key router
  try {
    const chatPayload = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
      })),
    ];

    const fallbackRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatPayload,
        model: 'openai',
        temperature: 0.3,
      }),
    });

    if (fallbackRes.ok) {
      const text = await fallbackRes.text();
      if (text && text.trim().length > 5) {
        return res.status(200).json({ reply: text.trim() });
      }
    }
  } catch (err) {
    console.error('All backend AI services failed:', err);
  }

  return res.status(200).json({
    reply: `Hello! I am your FoodWise Clinical Assistant.\n\nPlease describe what symptoms you are experiencing (or attach a photo of a rash/swelling), and I will provide an immediate first-aid plan and specialist recommendation.`,
  });
}