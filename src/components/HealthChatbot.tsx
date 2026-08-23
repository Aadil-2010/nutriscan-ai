import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  HeartPulse, 
  AlertTriangle, 
  Flame, 
  ShieldCheck,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  { label: 'Allergic Reaction', icon: AlertTriangle, query: 'What are the immediate first aid steps for an acute food allergic reaction?' },
  { label: 'Minor Burn', icon: Flame, query: 'How do I provide first aid for a minor kitchen burn?' },
  { label: 'Choking First Aid', icon: HeartPulse, query: 'What are the immediate first aid steps if someone is choking?' },
];

const HEALTH_KNOWLEDGE: { keywords: string[]; title: string; answer: string }[] = [
  {
    keywords: ['allergi', 'anaphylax', 'reaction', 'hives', 'swelling', 'peanut', 'nut', 'seafood', 'shellfish'],
    title: 'Acute Food Allergic Reaction & Anaphylaxis Protocol',
    answer: `**Immediate First Aid for Food Allergy / Anaphylaxis:**

1. **Check for Red Flags**: Throat tightness, difficulty breathing, wheezing, dizziness, or widespread hives indicate **Anaphylaxis**.
2. **Use Epinephrine (EpiPen)**: If the person has an auto-injector, inject it immediately into the outer mid-thigh. Hold for 3–5 seconds.
3. **Call 911 / Emergency Services**: Always call emergency medical services immediately after using an auto-injector.
4. **Position the Person**: Keep them lying flat with legs raised. If breathing is difficult or they are vomiting, allow them to sit up slightly.
5. **Do NOT Give Oral Medication**: Do not give oral antihistamines or fluids if the person is struggling to swallow or breathe.`,
  },
  {
    keywords: ['burn', 'scald', 'hot oil', 'hot water', 'pan', 'stove', 'oven'],
    title: 'Kitchen Burn First Aid Protocol',
    answer: `**First Aid for Kitchen Burns and Scalds:**

1. **Cool Immediately**: Hold the burned area under cool, gentle running tap water for **10 to 20 minutes**.
2. **Never Use Ice**: Do not apply ice, iced water, butter, toothpaste, or oil—they cause tissue damage and invite infection.
3. **Remove Tight Items**: Take off rings, bracelets, or tight clothing around the area before swelling begins.
4. **Cover Cleanly**: Loosely cover the area with a sterile, non-stick dressing or clean plastic food wrap.
5. **Seek Urgent Care If**: The burn is larger than 3 inches, blistered deeply, on the face, hands, joints, or caused by chemicals.`,
  },
  {
    keywords: ['chok', 'choking', 'heimlich', 'airway', 'blocked', 'swallow'],
    title: 'Choking & Airway Obstruction First Aid',
    answer: `**Protocol for Adult / Child Choking:**

*If the person is coughing forcefully, encourage them to continue coughing.*

**If they cannot speak, cry, cough, or breathe:**
1. **5 Back Blows**: Lean the person forward, support their chest with one hand, and give 5 firm blows between shoulder blades with the heel of your hand.
2. **5 Abdominal Thrusts (Heimlich)**:
   * Stand behind them and wrap your arms around their waist.
   * Make a fist just above the navel.
   * Grasp your fist with the other hand and thrust sharply inward and upward.
3. **Repeat Cycle**: Alternate 5 back blows and 5 abdominal thrusts until object is expelled.
4. **If Unresponsive**: Lower to the floor and begin CPR immediately with chest compressions.`,
  },
  {
    keywords: ['cut', 'bleed', 'knife', 'wound', 'laceration', 'blood'],
    title: 'Kitchen Cut & Laceration Management',
    answer: `**First Aid for Deep Cuts and Bleeding:**

1. **Direct Pressure**: Place a clean cloth or sterile gauze over the cut and press down firmly without letting go for 5–10 full minutes.
2. **Elevate**: Elevate the injured hand or limb above the heart to reduce blood flow.
3. **Cleanse**: Once bleeding stops, rinse the wound gently with cool tap water and clean surrounding skin with mild soap.
4. **Bandage**: Apply antibiotic ointment and seal with a sterile adhesive bandage.
5. **Seek Stitches If**: The wound edges gap open, you see yellow fat/muscle, or bleeding does not stop after 10 minutes of direct pressure.`,
  },
  {
    keywords: ['msg', 'monosodium glutamate', 'e621', 'preservative', 'additive', 'nitrite', 'nitrate', 'aspartame', 'e-number'],
    title: 'Food Additive & Chemical Safety Guide',
    answer: `**Food Additives & Allergen Safety Insights:**

* **Monosodium Glutamate (E621)**: Globally classified as safe by FDA and EFSA. A small subgroup may experience mild, transient sensitivity (flushing, mild headache).
* **Sodium Nitrite / Nitrate (E250-E252)**: Used in cured meats to prevent botulism. Moderation is recommended to limit dietary nitrosamines.
* **Sulfites (E220-E228)**: Common preservative in wine and dried fruits. High risk for asthmatics and sulfur-sensitive individuals.
* **Artificial Colors (Tartrazine E102, Allura Red E129)**: May exacerbate hyperactivity in sensitive children; require warning labels in the EU.`,
  },
  {
    keywords: ['food poison', 'nausea', 'vomit', 'diarrhea', 'salmonella', 'spoil', 'stomach pain'],
    title: 'Suspected Food Poisoning Protocol',
    answer: `**First Aid for Foodborne Illness / Food Poisoning:**

1. **Hydration First**: Sip small amounts of electrolyte solution, oral rehydration salts (ORS), or clear broth.
2. **Avoid Immediate Anti-Diarrheals**: In many bacterial infections, letting the body flush pathogens is important unless directed by a physician.
3. **Bland Diet (BRAT)**: When nausea subsides, introduce bananas, rice, applesauce, and toast.
4. **Call a Doctor If**: High fever (>102°F / 38.8°C), severe dehydration (dark urine, dizziness), blood in stool, or vomiting lasting >24 hours.`,
  }
];

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your FoodWise Health & First Aid Assistant. How can I assist you with kitchen first aid, allergen reactions, or food additive queries today?',
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

      // Greeting detection
      if (/^(hi|hello|hey|greetings|help)/i.test(lowerQuery.trim()) && lowerQuery.trim().split(' ').length <= 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Hello! I am standing by to assist. You can ask me about:\n\n* **Acute allergic reactions & EpiPen usage**\n* **Kitchen burns & scald first aid**\n* **Choking & Heimlich maneuver**\n* **Deep cuts & bleeding control**\n* **Food additive / E-number safety**',
          },
        ]);
        setLoading(false);
        return;
      }

      // Keyword matching across clinical triage database
      const matched = HEALTH_KNOWLEDGE.find((item) =>
        item.keywords.some((kw) => lowerQuery.includes(kw))
      );

      if (matched) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: matched.answer },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**Clinical First Aid & Food Safety Notice:**\n\n* **Emergency Rule**: For severe respiratory distress, facial swelling, or heavy bleeding, immediately contact your local emergency medical hotline.\n* **Ingredient Caution**: If you suspect an adverse food reaction, immediately halt consumption and inspect packaging for bold allergen declarations (milk, nuts, wheat, soy, eggs, shellfish).\n* **Burns & Cuts**: Always run cool tap water over burns for 15+ minutes and apply uninterrupted direct pressure on open cuts.\n\n*You can ask specifically about burns, cuts, choking, allergic reactions, food poisoning, or MSG/additives.*`,
          },
        ]);
      }
      setLoading(false);
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
        <span className="text-xs font-extrabold hidden sm:inline">Health & First Aid</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg h-[90vh] sm:h-[600px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
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
                  <p className="text-[11px] text-slate-400">Instant triage, allergen & burn guidance</p>
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
                    <span>Accessing clinical safety database...</span>
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
                  placeholder="Ask about allergic reactions, burns, cuts, or additive safety..."
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
                <span>Emergency notice: For acute life-threatening symptoms, dial 911 / emergency services immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};