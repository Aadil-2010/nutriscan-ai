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

interface IntakeSession {
  step: 'idle' | 'awaiting_food' | 'awaiting_activity' | 'complete';
  primarySymptom: string;
  dietHistory: string;
  activityHistory: string;
}

const STORAGE_KEY_CHAT = 'foodwise_ai_chat_history_v1';
const STORAGE_KEY_INTAKE = 'foodwise_ai_intake_session_v1';

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Load chat history from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
    return [
      {
        role: 'assistant',
        content: 'Hello! I am your FoodWise Clinical Assistant. Describe any symptoms you are experiencing to begin your assessment.',
      },
    ];
  });

  // Track conversational diagnosis intake state
  const [intake, setIntake] = useState<IntakeSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INTAKE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading intake session:', e);
    }
    return {
      step: 'idle',
      primarySymptom: '',
      dietHistory: '',
      activityHistory: '',
    };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save conversation and intake state on updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat:', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(intake));
    } catch (e) {
      console.error('Error saving intake:', e);
    }
  }, [intake]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleClearHistory = () => {
    const initial: Message[] = [
      {
        role: 'assistant',
        content: 'Conversation history cleared. What symptoms or medical queries can I assist you with?',
      },
    ];
    setMessages(initial);
    setIntake({
      step: 'idle',
      primarySymptom: '',
      dietHistory: '',
      activityHistory: '',
    });
    localStorage.removeItem(STORAGE_KEY_CHAT);
    localStorage.removeItem(STORAGE_KEY_INTAKE);
  };

  const evaluateClinicalProfile = (symptom: string, food: string, activity: string): string => {
    const s = symptom.toLowerCase();
    const f = food.toLowerCase();

    // 1. Allergic Reaction / Anaphylaxis
    if (s.includes('allergi') || s.includes('hives') || s.includes('swelling') || s.includes('rash') || s.includes('itch') || f.includes('peanut') || f.includes('nut') || f.includes('seafood') || f.includes('shellfish') || f.includes('egg') || f.includes('milk')) {
      return `**Clinical Assessment & Referral:**

* **Suspected Condition**: Acute Allergic Reaction / Dietary Hypersensitivity
* **Recommended Specialist**: **Allergist / Immunologist** (or Urgent Care Physician)

**Immediate First-Aid Protocol:**
1. **EpiPen**: Administer auto-injector into outer mid-thigh if breathing is restricted.
2. **Call 911 / 112**: Seek immediate medical evaluation if throat tightness occurs.
3. **Stop Ingestion**: Cease consuming recent foods (${food || 'suspected allergens'}).
4. **Positioning**: Lie flat with legs elevated; do not give oral fluids if swallowing is difficult.`;
    }

    // 2. Peripheral Neuropathy / Nerve Compression / Circulation
    if (s.includes('numb') || s.includes('tingl') || s.includes('pin and needle') || s.includes('feet') || s.includes('foot') || s.includes('leg') || s.includes('hand')) {
      return `**Clinical Assessment & Referral:**

* **Suspected Condition**: Peripheral Neuropathy / Transient Nerve Compression / Vascular Insufficiency
* **Recommended Specialist**: **Neurologist** or **Vascular Specialist**

**Immediate First-Aid Protocol:**
1. **Restore Blood Flow**: Loosen tight footwear, socks, or uncross legs immediately.
2. **Stimulate Nerves**: Elevate feet slightly and gently flex toes/ankles for 3 minutes.
3. **Hydrate**: Drink a glass of water with electrolytes.
4. **Emergency Check**: If numbness spreads to one side of the face or arm with slurred speech, call 911 / emergency services immediately.`;
    }

    // 3. Acute Gastroenteritis / Food Poisoning
    if (s.includes('stomach') || s.includes('vomit') || s.includes('nausea') || s.includes('diarrhea') || s.includes('cramp') || s.includes('poison') || s.includes('belly')) {
      return `**Clinical Assessment & Referral:**

* **Suspected Condition**: Acute Gastroenteritis / Foodborne Pathogen Ingestion
* **Recommended Specialist**: **Gastroenterologist** or **General Physician**

**Immediate First-Aid Protocol:**
1. **Oral Rehydration**: Sip small amounts of oral rehydration salts (ORS) or electrolyte water.
2. **Gut Rest**: Avoid solid foods and dairy for the next 4–6 hours.
3. **Withhold Antidiarrheals**: Allow the gastrointestinal tract to expel toxins unless directed by a doctor.
4. **Seek Immediate Care**: If high fever (>102°F / 38.8°C), blood in stool, or inability to keep fluids down persists.`;
    }

    // 4. Migraine / Tension Headache
    if (s.includes('headache') || s.includes('head') || s.includes('migraine') || s.includes('dizzi')) {
      return `**Clinical Assessment & Referral:**

* **Suspected Condition**: Tension Headache / Migraine / Dehydration
* **Recommended Specialist**: **Neurologist** or **General Physician**

**Immediate First-Aid Protocol:**
1. **Rapid Hydration**: Drink 500ml of cool water.
2. **Sensory Rest**: Lie down in a dark, quiet room with a cold compress on your forehead.
3. **Limit Screen Exposure**: Discontinue mobile and monitor use.
4. **Seek Urgent Care**: If the headache is sudden and explosive, or accompanied by neck stiffness and confusion.`;
    }

    // 5. General Clinical Assessment
    return `**Clinical Assessment & Referral:**

* **Suspected Condition**: Undifferentiated Systemic / Metabolic Symptom
* **Recommended Specialist**: **Internal Medicine Specialist (General Physician)**

**Immediate First-Aid Protocol:**
1. **Rest & Vital Check**: Sit in a supportive chair or lie down in a well-ventilated area.
2. **Hydrate**: Sip room-temperature water slowly.
3. **Record Timeline**: Log when symptoms started relative to food (${food}) and activity (${activity}).
4. **Consult Clinic**: Visit a primary care clinic for physical and metabolic screening.`;
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMessage: Message = { role: 'user', content: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      // Step 0: Conversational Closures & Greetings
      if (/(thank|thanks|ok|okay|cool|bye|goodbye|all good|fine now)/i.test(userText.toLowerCase()) && userText.split(' ').length <= 4) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "You're welcome! Stay safe, and describe any new symptoms whenever you need medical triage.",
          },
        ]);
        setIntake({ step: 'idle', primarySymptom: '', dietHistory: '', activityHistory: '' });
        setLoading(false);
        return;
      }

      // Step 1: Initial Symptom Reporting -> Ask Food Intake
      if (intake.step === 'idle' || intake.step === 'complete') {
        setIntake({
          step: 'awaiting_food',
          primarySymptom: userText,
          dietHistory: '',
          activityHistory: '',
        });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I have noted your symptom: **"${userText}"**.\n\nTo determine the exact cause and doctor referral:\n1. **What specific foods, snacks, or beverages have you consumed in the last 4–6 hours?**`,
          },
        ]);
        setLoading(false);
        return;
      }

      // Step 2: Food Received -> Ask Physical Activity & Environment
      if (intake.step === 'awaiting_food') {
        setIntake((prev) => ({
          ...prev,
          step: 'awaiting_activity',
          dietHistory: userText,
        }));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Got it. Food intake noted as: *${userText}*.\n\n2. **What physical activities, exertion, or posture have you been engaged in recently** (e.g., sitting for long hours, exercise, heat exposure, kitchen cooking)?`,
          },
        ]);
        setLoading(false);
        return;
      }

      // Step 3: Activity Received -> Generate Complete Clinical Diagnosis & Referral
      if (intake.step === 'awaiting_activity') {
        const finalDiet = intake.dietHistory;
        const finalActivity = userText;
        const finalSymptom = intake.primarySymptom;

        setIntake((prev) => ({
          ...prev,
          step: 'complete',
          activityHistory: userText,
        }));

        const prescription = evaluateClinicalProfile(finalSymptom, finalDiet, finalActivity);
        setMessages((prev) => [...prev, { role: 'assistant', content: prescription }]);
        setLoading(false);
        return;
      }
    }, 400);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
        aria-label="Open Health Assistant"
      >
        <Bot className="w-5 h-5" />
        <span className="text-xs font-extrabold hidden sm:inline">Health AI Triage</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg h-[90vh] sm:h-[600px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    FoodWise Clinical Assistant
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Active Intake
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Multi-turn symptom triage & specialist matching</p>
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

            {/* Chat Message Scrollport */}
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
                    <span>Processing clinical assessment...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* User Input Field */}
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
                  placeholder={
                    intake.step === 'awaiting_food'
                      ? 'List foods/drinks consumed recently...'
                      : intake.step === 'awaiting_activity'
                      ? 'Describe your recent activity or posture...'
                      : 'Describe your symptom (e.g. feet numb, rash, cramps)...'
                  }
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
                <span>Emergency: For severe breathing difficulty, chest pain, or trauma, dial 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};