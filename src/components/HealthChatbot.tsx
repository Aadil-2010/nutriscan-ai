import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  HeartPulse, 
  AlertTriangle, 
  Flame, 
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  { label: 'Allergic Reaction', icon: AlertTriangle, query: 'What are the first aid steps for an allergic reaction?' },
  { label: 'Minor Burn', icon: Flame, query: 'How to treat a minor kitchen burn?' },
  { label: 'Choking First Aid', icon: HeartPulse, query: 'What to do if someone is choking?' },
];

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Health & First Aid Assistant. Ask me about any symptom, first-aid situation, or food additive concern.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const generateLocalTriage = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('numb') || q.includes('tingl') || q.includes('feet') || q.includes('foot') || q.includes('leg') || q.includes('pin and needle')) {
      return `**Numbness / Tingling in Feet & Limbs:**

1. **Check Circulation**: Loosen tight footwear, socks, or crossed legs to restore blood flow.
2. **Shift Position**: Gently walk or wiggle toes for 2–3 minutes to stimulate nerve response.
3. **Emergency Warning**: Seek immediate care if accompanied by sudden facial drooping, arm weakness, or difficulty speaking (signs of stroke).
4. **Consult Physician**: Schedule a medical checkup if numbness is persistent, painful, or recurring daily (indicates neuropathy or lumbar nerve compression).`;
    }

    if (q.includes('headache') || q.includes('migraine') || q.includes('head hurt')) {
      return `**Headache Relief Steps:**

1. **Hydrate**: Drink 1–2 full glasses of clean water immediately.
2. **Rest**: Lie down in a dark, quiet room with a cool damp cloth over your forehead.
3. **Avoid Eyestrain**: Step away from digital screens and bright lighting.
4. **Emergency Check**: Dial emergency if pain is sudden/explosive or paired with stiff neck and confusion.`;
    }

    if (q.includes('stomach') || q.includes('cramp') || q.includes('belly') || q.includes('digest')) {
      return `**Stomach Pain & Cramp Protocol:**

1. **Rest Digestive Tract**: Sip warm water or chamomile/ginger tea slowly; avoid solid meals.
2. **Apply Heat**: Place a warm heating pad or hot water bottle over the abdomen.
3. **Avoid Irritants**: Skip dairy, fried foods, caffeine, and NSAID painkillers like ibuprofen.
4. **Seek Urgent Care**: If pain is severe on the lower-right side, radiating to the back, or accompanied by fever.`;
    }

    if (q.includes('burn') || q.includes('scald') || q.includes('oil')) {
      return `**Kitchen Burn Care:**

1. **Cool Water**: Run cool tap water over the burn for 10–15 minutes (never use ice).
2. **Remove Jewelry**: Take off rings and watches before swelling begins.
3. **Protect**: Cover loosely with a clean non-stick bandage.
4. **No Ointments**: Do not apply butter, oil, or toothpaste.`;
    }

    if (q.includes('cut') || q.includes('bleed') || q.includes('wound') || q.includes('knife')) {
      return `**Kitchen Cut / Bleeding:**

1. **Direct Pressure**: Press firmly with clean cloth for 5 continuous minutes.
2. **Elevate**: Keep the wound raised above heart level.
3. **Cleanse**: Rinse with cool water and wash perimeter skin with soap.
4. **Bandage**: Apply antiseptic and a sterile dressing.`;
    }

    if (q.includes('allergi') || q.includes('anaphylax') || q.includes('hive') || q.includes('swelling')) {
      return `**Allergic Reaction / Anaphylaxis:**

1. **Inject EpiPen**: Use auto-injector in outer mid-thigh immediately.
2. **Call 911 / 112**: Request emergency medical help right away.
3. **Lie Flat**: Elevate legs; sit upright only if breathing is difficult.
4. **Avoid Oral Meds**: Do not give liquids or pills if swallowing is restricted.`;
    }

    if (q.includes('chok') || q.includes('airway') || q.includes('throat') || q.includes('heimlich')) {
      return `**Choking First Aid:**

1. **5 Back Blows**: Lean person forward and deliver firm heel-of-hand blows between shoulder blades.
2. **5 Abdominal Thrusts**: Pull inward and upward above the navel (Heimlich).
3. **Alternate**: Repeat 5 blows and 5 thrusts until the blockage clears.
4. **If Unconscious**: Lower to the floor and start CPR compressions.`;
    }

    return `**Health Assessment for "${query}":**

1. **Immediate Safety**: If you experience severe pain, breathing distress, or sudden weakness, call local emergency services immediately.
2. **Rest & Monitor**: Sit or lie down in a safe, comfortable position and track any symptom changes.
3. **Avoid Self-Medication**: Do not take unprescribed drugs until the underlying cause is identified.
4. **Consult a Doctor**: Visit a licensed medical professional if this symptom persists or worsens over the next few hours.`;
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      // First attempt: Fast, free AI API for dynamic medical triage
      const response = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(
          `You are FoodWise Health & First Aid AI. 
Provide a clear, brief, clinical response for the query. 
Use a bold title and maximum 4 numbered action steps. Keep it under 60 words total.
Always advise emergency care if life-threatening.
Query: ${textToSend}`
        )}`,
        { signal: AbortSignal.timeout(3500) }
      );

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 10) {
          setMessages((prev) => [...prev, { role: 'assistant', content: text.trim() }]);
          setLoading(false);
          return;
        }
      }
      throw new Error('Fallback to local engine');
    } catch {
      // Instant contextual fallback engine
      const localReply = generateLocalTriage(textToSend);
      setMessages((prev) => [...prev, { role: 'assistant', content: localReply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
        aria-label="Open Health Assistant"
      >
        <Bot className="w-5 h-5" />
        <span className="text-xs font-extrabold hidden sm:inline">Health & First Aid</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg h-[90vh] sm:h-[580px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Health & First Aid AI
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Online
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Instant triage for symptoms, burns, cuts & allergies</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.query)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-[11px] font-semibold text-slate-300 hover:text-white whitespace-nowrap transition-all flex-shrink-0 cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none'
                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-none'
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
                    <span>Analyzing clinical steps...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

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
                  placeholder="Describe your symptom (e.g. feet numb, headache, burns)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-slate-500">
                <PhoneCall className="w-3 h-3 text-amber-500" />
                <span>For acute life-threatening symptoms, dial 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};