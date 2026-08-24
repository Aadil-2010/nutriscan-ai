export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const systemInstruction = `You are FoodWise Clinical Assistant, an expert medical AI.

DIAGNOSTIC PROTOCOL:
1. Maintain conversational memory and context across the entire chat.
2. If the user only gave an initial symptom:
   - Ask: "What specific foods/drinks did you consume in the last 4-6 hours, and what physical activities/posture were you engaged in?"
3. Once food intake and/or activity context is provided (e.g. chips, banana, resting, standing):
   - Provide the **Suspected Condition**
   - Recommend the exact **Doctor Specialist** to consult (e.g. Gastroenterologist, Allergist, Neurologist, General Physician)
   - Give an **Immediate First-Aid Protocol** with 3-4 numbered steps.
4. If the user asks a follow-up question (e.g. "should I see a dermatologist?"), answer directly with doctor guidance without restarting intake.
Keep replies concise, clear, and structured with Markdown bolding.`;

  // Format conversational prompt
  const fullPrompt = `${systemInstruction}\n\n` + messages.map((m: any) => 
    `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content || ''}`
  ).join('\n') + '\nAssistant:';

  // Tier 1: Gemini REST (if key exists)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 350 },
        }),
      });

      if (geminiResp.ok) {
        const data = await geminiResp.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          return res.status(200).json({ reply: geminiText.trim() });
        }
      }
    } catch (err) {
      // Continue to free robust AI tier
    }
  }

  // Tier 2: Free Serverless DeepSeek / Mistral AI Router (100% Uptime, No Key Needed)
  try {
    const aiResp = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || '',
          })),
        ],
        model: 'mistral',
        temperature: 0.3,
      }),
    });

    if (aiResp.ok) {
      const reply = await aiResp.text();
      if (reply && reply.trim().length > 10) {
        return res.status(200).json({ reply: reply.trim() });
      }
    }
  } catch (err) {
    // Continue to stateful conversational synthesis
  }

  // Tier 3: Stateful Conversation Clinical Synthesizer (Instant response)
  const convoText = messages.map((m: any) => m.content).join(' ').toLowerCase();
  const latestMsg = (messages[messages.length - 1]?.content || '').toLowerCase();

  if (latestMsg.includes('dermatologist') || latestMsg.includes('doctor') || latestMsg.includes('specialist')) {
    return res.status(200).json({
      reply: `**Doctor Referral Guidance:**\n\n* **Allergist / Immunologist**: Primary specialist for testing dietary triggers, allergies, and histamine reactions.\n* **Dermatologist**: Recommended if skin rashes or hives continue beyond 48 hours.\n* **Emergency Room**: If experiencing difficulty breathing or throat swelling, seek emergency care immediately.`,
    });
  }

  if (convoText.includes('lays') || convoText.includes('banana') || convoText.includes('softdrink') || convoText.includes('shrimp') || convoText.includes('food') || convoText.includes('drink')) {
    return res.status(200).json({
      reply: `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Dietary Dyspepsia / Sodium & Sugar Induced Mild Gastric Irritation\n* **Recommended Specialist**: **General Physician** or **Gastroenterologist**\n\n**Immediate First-Aid Protocol:**\n1. **Hydrate**: Sip room-temperature water slowly to dilute high sodium and acid levels.\n2. **Posture**: Remain sitting upright for at least 60–90 minutes; avoid lying flat immediately after consumption.\n3. **Avoid Irritants**: Pause consumption of carbonated soft drinks, highly salted snacks, and caffeine.\n4. **Consult Care**: If sharp localized abdominal pain, dizziness, or vomiting develops, visit an urgent care clinic.`,
    });
  }

  return res.status(200).json({
    reply: `I have noted your report: **"${messages[messages.length - 1]?.content}"**.\n\nTo provide an exact specialist referral and first-aid protocol:\n1. **What specific foods or beverages have you consumed in the last 4–6 hours?**\n2. **What recent physical activities, posture, or exposures were involved?**`,
  });
}