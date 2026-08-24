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

const HEALTH_KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['allergi', 'anaphylax', 'reaction', 'hives', 'swelling', 'peanut', 'nut', 'seafood', 'shellfish', 'wheez', 'rash', 'itch'],
    answer: `**Allergic Reaction / Anaphylaxis:**

1. **Inject EpiPen**: Use auto-injector in outer mid-thigh immediately.
2. **Call 911 / 112**: Seek emergency medical support.
3. **Lie Flat**: Keep legs elevated; sit upright only if breathing is difficult.
4. **Avoid Oral Meds**: Do not give liquids or pills if swallowing is hard.`,
  },
  {
    keywords: ['burn', 'scald', 'hot oil', 'hot water', 'pan', 'stove', 'oven', 'steam', 'fire'],
    answer: `**Kitchen Burn Care:**

1. **Cool Water**: Run cool tap water over the burn for 10–15 minutes (never use ice).
2. **Remove Jewelry**: Take off rings and watches before swelling begins.
3. **Protect**: Cover loosely with a clean, non-stick dressing or plastic wrap.
4. **No Ointments**: Do not apply butter, oil, or toothpaste.`,
  },
  {
    keywords: ['chok', 'choking', 'heimlich', 'airway', 'blocked', 'swallow', 'throat', 'cough'],
    answer: `**Choking First Aid:**

1. **5 Back Blows**: Lean victim forward and strike firmly between shoulder blades.
2. **5 Abdominal Thrusts**: Place fist above navel and pull inward/upward (Heimlich).
3. **Alternate**: Repeat 5 blows and 5 thrusts until the airway clears.
4. **If Unconscious**: Lower to the floor and start CPR compressions immediately.`,
  },
  {
    keywords: ['cut', 'bleed', 'knife', 'wound', 'laceration', 'blood', 'slice', 'finger'],
    answer: `**Kitchen Cut / Bleeding:**

1. **Direct Pressure**: Press firmly on the wound with a clean cloth for 5 minutes.
2. **Elevate**: Keep the injured hand or arm above heart level.
3. **Cleanse**: Rinse with cool water and mild soap around the edge.
4. **Bandage**: Apply antiseptic and a sterile dressing. Seek stitches if bleeding persists.`,
  },
  {
    keywords: ['poison', 'nausea', 'vomit', 'diarrhea', 'salmonella', 'spoil', 'stomach', 'cramp', 'fever', 'expired', 'bad food'],
    answer: `**Food Poisoning Steps:**

1. **Rehydrate**: Sip electrolyte solution or oral rehydration salts slowly.
2. **Rest Stomach**: Avoid solid foods for a few hours until vomiting stops.
3. **Bland Diet**: Eat plain toast, crackers, bananas, or rice.
4. **Seek Medical Care**: If fever exceeds 102°F (38.8°C), blood appears, or vomiting lasts over 24h.`,
  },
  {
    keywords: ['msg', 'monosodium', 'e621', 'preservative', 'additive', 'nitrite', 'nitrate', 'aspartame', 'e-number', 'chemical', 'sugar', 'sodium', 'salt'],
    answer: `**Additive & Chemical Safety:**

1. **MSG (E621)**: Globally approved as safe; minor sensitivity causes brief headaches.
2. **Nitrites (E250)**: Limit heavy consumption in processed meats.
3. **Sulfites (E220)**: Check wine and dried fruit labels if you have asthma.
4. **Artificial Sweeteners**: Safe within regulated daily limits; adjust if bloating occurs.`,
  },
  {
    keywords: ['eye', 'splash', 'chili', 'pepper', 'chemical', 'irritat'],
    answer: `**Eye Irritation / Chemical Splash:**

1. **Flush**: Rinse the open eye under cool running water for 15 minutes.
2. **Remove Contacts**: Take out contact lenses immediately.
3. **Do Not Rub**: Keep hands away from eyes to prevent corneal scratches.
4. **Seek Help**: Visit urgent care if stinging or blurred vision continues.`,
  },
  {
    keywords: ['faint', 'dizzi', 'lighthead', 'pass out', 'blackout'],
    answer: `**Fainting / Dizziness:**

1. **Lie Down**: Keep the person flat and raise feet 12 inches.
2. **Loosen Clothing**: Open tight collars and ensure fresh air.
3. **Check Breathing**: Ensure the airway is open and clear.
4. **Hydrate Slowly**: Offer water only once fully conscious and alert.`,
  },
];

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Health & First Aid Assistant. Ask me about cuts, burns, allergic reactions, choking, or food additive queries.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    setTimeout(() => {
      const lowerQuery = textToSend.toLowerCase();

      // Greeting check
      if (/^(hi|hello|hey|greetings|help)(\s|$)/i.test(lowerQuery.trim()) && lowerQuery.trim().split(' ').length <= 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**How I Can Help:**

1. **Allergies & Anaphylaxis**: Immediate action and EpiPen steps.
2. **Kitchen Burns**: First aid cooling and bandaging.
3. **Choking**: Back blows and Heimlich instructions.
4. **Cuts & Bleeding**: Pressure and wound cleansing.
5. **Food Additives & Poisoning**: Toxicity levels and rehydration care.`,
          },
        ]);
        setLoading(false);
        return;
      }

      // Keyword match
      const matched = HEALTH_KNOWLEDGE.find((item) =>
        item.keywords.some((kw) => lowerQuery.includes(kw))
      );

      if (matched) {
        setMessages((prev) => [...prev, { role: 'assistant', content: matched.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**General First Aid Steps:**

1. **Emergency Check**: Dial 911 / 112 immediately if breathing is difficult or bleeding is severe.
2. **Stop Consumption**: If reacting to food, discard it and check package allergens.
3. **Basic Care**: Use cool running water for burns; apply steady pressure for cuts.
4. **Ask Specifically**: Type words like *burn, cut, choke, allergy, poison, or additive* for exact steps.`,
          },
        ]);
      }
      setLoading(false);
    }, 300);
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
                      <ShieldCheck className="w-3 h-3" /> Ready
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Instant triage & emergency guidance</p>
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
                    <span>Processing protocol...</span>
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
                  placeholder="Ask about burns, cuts, allergies, choking, poisoning..."
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
                <span>Emergency: For life-threatening emergencies, dial 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};