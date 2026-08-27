import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Bot, 
  Send, 
  X, 
  HeartPulse, 
  ShieldCheck, 
  RotateCcw, 
  Stethoscope, 
  PhoneCall,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 preview
}

const STORAGE_KEY_CHAT = 'foodwise_ai_chat_history_v5';

const SYSTEM_INSTRUCTION = `You are FoodWise Clinical Assistant, an expert first-aid & medical triage AI.

DIAGNOSTIC PROTOCOL:
1. ALWAYS prioritize the primary physical complaint (swelling, rash, pain, numbness, sting, wound) and any uploaded photos over incidental dietary snacks.
2. If the user attaches an image, inspect it carefully (e.g. skin redness, swelling, hives, insect bite, wound, food label) and mention your visual observation.
3. OUTPUT FORMAT:
   - **Suspected Condition**: State the primary condition matching the physical symptom/image.
   - **Recommended Doctor Specialist**: State the exact specialist (e.g., Allergist, Orthopedist, Dermatologist, Gastroenterologist, ER).
   - **Immediate First-Aid Protocol**: Provide 3-4 numbered, calm, actionable steps.
4. If the user asks a follow-up or general question, answer directly without resetting the intake.
Keep replies clear, compassionate, structured with Markdown, and under 100 words.`;

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Dedicated Fallback Triage Logic if API is offline
  const fallbackDiagnose = (history: Message[], latestInput: string): string => {
    const fullText = history.map(m => m.content).join(' ').toLowerCase() + ' ' + latestInput.toLowerCase();

    if (fullText.includes('swell') || fullText.includes('hand') || fullText.includes('finger') || fullText.includes('wrist') || fullText.includes('arm')) {
      return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Acute Peripheral Edema / Localized Allergic Angioedema / Soft Tissue Trauma\n* **Recommended Specialist**: **Allergist / Immunologist** (if allergic) or **Orthopedist / Urgent Care**\n\n**Immediate First-Aid Protocol:**\n1. **Remove Rings & Jewelry Immediately**: Take off rings and watches before swelling restricts circulation.\n2. **Elevate Hand**: Propped up on a pillow above heart level to reduce fluid buildup.\n3. **Cold Pack**: Apply an ice pack wrapped in a towel for 10–15 minutes.\n4. **Emergency**: If lips or throat start swelling or breathing is hard, call 911 / 112 immediately.`;
    }

    if (fullText.includes('rash') || fullText.includes('hive') || fullText.includes('itch') || fullText.includes('redness')) {
      return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Acute Contact Dermatitis / Urticaria (Hives)\n* **Recommended Specialist**: **Allergist / Immunologist** or **Dermatologist**\n\n**Immediate First-Aid Protocol:**\n1. **Cool Compress**: Apply a cool, damp cloth to soothe the burning and itching.\n2. **Avoid Scratching**: Keep skin intact to avoid secondary bacterial infection.\n3. **Rinse Area**: Wash gently with cool water and mild soap.\n4. **Monitor**: Seek emergency care if accompanied by dizziness or facial swelling.`;
    }

    if (fullText.includes('stomach') || fullText.includes('nausea') || fullText.includes('vomit') || fullText.includes('pain') || fullText.includes('cramp')) {
      return `**Clinical Assessment & Referral:**\n\n* **Suspected Condition**: Acute Gastric Distress / Food Sensitivity\n* **Recommended Specialist**: **General Physician** or **Gastroenterologist**\n\n**Immediate First-Aid Protocol:**\n1. **Hydrate**: Sip room-temperature water or ORS slowly.\n2. **Stay Upright**: Avoid lying flat for 90 minutes to prevent acid reflux.\n3. **Gut Rest**: Pause heavy, dairy, or fried foods for 4–6 hours.\n4. **Emergency**: Seek immediate care if severe sharp localized pain develops.`;
    }

    return `I have received your inquiry: **"${latestInput}"**.\n\n**Clinical Guidance:**\n* **Recommended Specialist**: **General Physician** for initial evaluation.\n\n**Immediate First-Aid Protocol:**\n1. **Rest**: Avoid strenuous movement or exacerbating physical strain.\n2. **Hydration**: Maintain steady fluid intake.\n3. **Track Changes**: Note when the symptom began and any physical triggers.`;
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userText = input.trim() || (selectedImage ? 'Attached photo for symptom analysis.' : '');
    const currentImg = selectedImage;

    const updatedHistory: Message[] = [
      ...messages, 
      { role: 'user', content: userText, image: currentImg || undefined }
    ];

    setMessages(updatedHistory);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });

        const contents: any[] = updatedHistory.map((m) => {
          const parts: any[] = [{ text: m.content }];

          if (m.image && m.image.includes(',')) {
            const mimeType = m.image.split(';')[0].replace('data:', '');
            const base64Data = m.image.split(',')[1];
            parts.push({
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            });
          }

          return {
            role: m.role === 'assistant' ? 'model' : 'user',
            parts,
          };
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          setMessages([...updatedHistory, { role: 'assistant', content: response.text.trim() }]);
          setLoading(false);
          return;
        }
      }
      throw new Error('Fallback needed');
    } catch {
      setTimeout(() => {
        const fallbackText = fallbackDiagnose(messages, userText);
        setMessages([...updatedHistory, { role: 'assistant', content: fallbackText }]);
        setLoading(false);
      }, 350);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-full shadow-xl shadow-emerald-500/25 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
        aria-label="Open Health Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg h-[92vh] sm:h-[620px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    FoodWise Clinical AI
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Symptom evaluation, photo triage & first aid</p>
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
                <div className="text-center py-12 px-4 space-y-3 text-slate-500">
                  <HeartPulse className="w-10 h-10 text-emerald-500/40 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    Describe any symptoms or upload a photo of a rash/swelling to receive immediate first aid and doctor referrals.
                  </p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-md'
                    }`}
                  >
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="User uploaded symptom" 
                        className="rounded-xl max-h-48 w-auto object-cover border border-slate-700/50"
                      />
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                    <HeartPulse className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>Analyzing clinical scenario & image...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Image Attachment Area */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              {selectedImage && (
                <div className="relative inline-block">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="w-14 h-14 object-cover rounded-xl border-2 border-emerald-500 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-400 text-white p-0.5 rounded-full shadow"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload / Snap Photo"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe symptom or upload photo..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />

                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <PhoneCall className="w-3 h-3 text-amber-500" />
                <span>Emergency: For throat swelling, severe trauma, or breathing distress, call 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};