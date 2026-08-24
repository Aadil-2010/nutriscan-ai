import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  HeartPulse, 
  ShieldCheck,
  RotateCcw,
  Stethoscope,
  PhoneCall
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY_CHAT = 'foodwise_ai_chat_history_v1';

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
    return [];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat:', e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY_CHAT);
  };

  // Smart Contextual Medical Evaluator Engine
  const generateClinicalTriage = (chatHistory: Message[], latestQuery: string): string => {
    const fullHistoryText = chatHistory.map(m => m.content).join(' ').toLowerCase() + ' ' + latestQuery.toLowerCase();
    const q = latestQuery.toLowerCase();

    // 1. Follow-up Specialist Check
    if (q.includes('dermatologist') || q.includes('allergist') || q.includes('neurologist') || q.includes('doctor') || q.includes('physician') || q.includes('should i see')) {
      if (fullHistoryText.includes('shrimp') || fullHistoryText.includes('seafood') || fullHistoryText.includes('peanut') || fullHistoryText.includes('allergi') || fullHistoryText.includes('hive')) {
        return `**Doctor Specialist Recommendation:**\n\n* **Primary Specialist**: **Allergist / Immunologist** — Recommended for formal IgE allergy skin-prick testing and EpiPen prescription.\n* **Secondary Specialist**: **Dermatologist** — Appropriate if rashes or hives persist beyond 48 hours.\n* **Emergency Rule**: If you develop lip swelling, throat tightness, or wheezing, go immediately to the nearest Emergency Room.`;
      }
      return `**Specialist Recommendation:**\n\n* Start with a **General Physician / Primary Care Doctor** for general examination and referral.\n* Consult a **Specialist** (Neurologist for nerves, Gastroenterologist for stomach/digestive, Allergist for reactions) if specific symptoms persist.`;
    }

    // 2. Initial Intake Questioning (If no context yet)
    const mentionsSymptom = /(numb|feet|headache|pain|ache|burn|cut|rash|itch|vomit|nausea|cramp|stomach|swelling|throat|dizzi)/i.test(q);
    const mentionsFoodOrActivity = /(eat|ate|drank|food|shrimp|fish|nut|dairy|milk|sit|sat|walk|run|work|cook)/i.test(q);

    if (mentionsSymptom && !mentionsFoodOrActivity && chatHistory.length < 2) {
      return `I have noted your symptom: **"${latestQuery}"**.\n\nTo identify the exact cause and recommend the right specialist:\n1. **What specific foods or beverages have you consumed in the last 4–6 hours?**\n2. **What activities or physical postures were you engaged in prior to this symptom?**`;
    }

    // 3. Allergic Reactions / Dietary
    if (fullHistoryText.includes('shrimp') || fullHistoryText.includes('peanut') || fullHistoryText.includes('seafood') || fullHistoryText.includes('allergi') || fullHistoryText.includes('hive') || fullHistoryText.includes('itch') || fullHistoryText.includes('swelling')) {
      return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Acute Dietary Allergy / Histamine Hypersensitivity\n* **Recommended Doctor**: **Allergist / Immunologist**\n\n**Immediate First-Aid Protocol:**\n1. **EpiPen**: Administer epinephrine auto-injector into outer thigh immediately if breathing is tight.\n2. **Stop Ingestion**: Cease consuming any trigger food or drinks.\n3. **Call 911 / 112**: Seek immediate medical emergency care if throat or lips swell.\n4. **Oral Antihistamine**: Consider an OTC antihistamine (e.g., Cetirizine) only if swallowing is completely normal.`;
    }

    // 4. Neuropathy / Numbness
    if (fullHistoryText.includes('numb') || fullHistoryText.includes('tingl') || fullHistoryText.includes('pin and needle') || fullHistoryText.includes('feet') || fullHistoryText.includes('foot') || fullHistoryText.includes('leg')) {
      return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Peripheral Neuropathy / Transient Nerve Compression\n* **Recommended Doctor**: **Neurologist** or **Vascular Specialist**\n\n**Immediate First-Aid Protocol:**\n1. **Restore Circulation**: Loosen tight footwear and uncross legs.\n2. **Gentle Movement**: Slowly flex feet and wiggle toes for 2–3 minutes.\n3. **Hydrate**: Drink 1–2 glasses of water with electrolytes.\n4. **Emergency Rule**: Seek emergency care immediately if accompanied by sudden facial weakness or slurred speech.`;
    }

    // 5. Gastroenteritis / Poisoning
    if (fullHistoryText.includes('stomach') || fullHistoryText.includes('vomit') || fullHistoryText.includes('nausea') || fullHistoryText.includes('diarrhea') || fullHistoryText.includes('cramp') || fullHistoryText.includes('poison')) {
      return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Acute Gastroenteritis / Foodborne Illness\n* **Recommended Doctor**: **Gastroenterologist** or **General Physician**\n\n**Immediate First-Aid Protocol:**\n1. **Oral Rehydration**: Sip oral rehydration salts (ORS) or electrolyte water in small amounts.\n2. **Gut Rest**: Avoid solid foods and dairy for 4–6 hours.\n3. **Avoid NSAIDs**: Do not take ibuprofen on an upset stomach.\n4. **Urgent Care**: If fever exceeds 102°F (38.8°C) or blood is present, visit a clinic immediately.`;
    }

    // 6. Generic Assessment
    return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Systemic / Contextual Symptom for "${latestQuery}"\n* **Recommended Doctor**: **General Physician / Internal Medicine**\n\n**Immediate First-Aid Protocol:**\n1. **Rest**: Sit or lie down in a well-ventilated, comfortable area.\n2. **Hydrate**: Drink room-temperature water steadily.\n3. **Monitor Vitals**: Note any progression or spread of symptoms.\n4. **Consultation**: Schedule an appointment with your healthcare provider if symptoms do not resolve.`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const updatedHistory: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      // Build conversation prompt
      const contextString = updatedHistory
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `You are FoodWise Clinical AI. Analyze the context and provide medical triage:
${contextString}

Instructions:
- If user asks follow-up (e.g. should I see a dermatologist), answer directly based on previous context.
- When sufficient info is present: Give Suspected Condition, Recommended Doctor Specialist, and Numbered First-Aid steps.
- Keep response clear, direct, and under 90 words.`;

      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3800),
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 15) {
          setMessages([...updatedHistory, { role: 'assistant', content: text.trim() }]);
          setLoading(false);
          return;
        }
      }
      throw new Error('Fallback needed');
    } catch {
      // Robust instant clinical fallback engine
      const fallbackReply = generateClinicalTriage(messages, userText);
      setMessages([...updatedHistory, { role: 'assistant', content: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Icon-Only Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-full shadow-xl shadow-emerald-500/25 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
        aria-label="Open Health Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg h-[90vh] sm:h-[600px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    FoodWise Clinical Assistant
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> AI Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Live symptom triage & specialist matching</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClearHistory}
                  title="Reset conversation"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 px-4 space-y-2 text-slate-500">
                  <HeartPulse className="w-8 h-8 text-emerald-500/40 mx-auto" />
                  <p className="text-xs text-slate-400">Describe any symptom or ask any medical question to begin triage.</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                    <HeartPulse className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>Analyzing clinical scenario...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe symptoms, diet history, or ask medical questions..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-slate-500">
                <PhoneCall className="w-3 h-3 text-amber-500" />
                <span>Emergency: For chest pain, airway swelling, or severe trauma, dial 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};