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
  PhoneCall 
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY_CHAT = 'foodwise_ai_chat_history_v3';

const SYSTEM_INSTRUCTION = `You are FoodWise Clinical Assistant, an expert medical triage AI.

DIAGNOSTIC PROTOCOL:
1. Prioritize the primary physical complaint (e.g., swollen hand, hives, headache, wound) rather than minor dietary details.
2. If the user only gave an initial vague symptom without context:
   - Ask clarifying questions about food consumed in the last 4-6 hours and recent physical activities/trauma.
3. Once sufficient context is known:
   - Provide the **Suspected Condition**
   - Provide the **Recommended Doctor Specialist** (e.g., Allergist, Orthopedist, Neurologist, General Physician)
   - Provide the **Immediate First-Aid Protocol** with 3-4 clear, numbered steps.
4. If the user asks a follow-up (e.g., "should I see a dermatologist?"), answer directly based on previous findings without resetting the intake.
Keep replies direct, clinical, structured with Markdown bolding, and under 90 words.`;

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

  const generateAIResponse = async (chatHistory: Message[]): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

    // Primary: Google GenAI Client
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contents = chatHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: { systemInstruction: SYSTEM_INSTRUCTION },
        });

        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Direct Gemini call failed, attempting high-speed router...', err);
      }
    }

    // Secondary: Direct Serverless Router
    const promptHistory = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...chatHistory.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const fallbackRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: promptHistory,
        model: 'openai',
        temperature: 0.2,
      }),
    });

    if (fallbackRes.ok) {
      const text = await fallbackRes.text();
      if (text && text.trim().length > 10) {
        return text.trim();
      }
    }

    throw new Error('All AI services are currently unresponsive.');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const updatedHistory: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const aiReply = await generateAIResponse(updatedHistory);
      setMessages([...updatedHistory, { role: 'assistant', content: aiReply }]);
    } catch (err: any) {
      console.error('Chat AI Error:', err);
      setMessages([
        ...updatedHistory,
        {
          role: 'assistant',
          content: `Unable to complete AI evaluation. Please verify your connection or visit urgent care if symptoms worsen.`,
        },
      ]);
    } finally {
      setLoading(false);
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
          <div className="w-full max-w-lg h-[90vh] sm:h-[600px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    FoodWise Clinical AI
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Online
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Symptom evaluation, doctor matching & first aid</p>
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-14 px-4 space-y-2 text-slate-500">
                  <HeartPulse className="w-9 h-9 text-emerald-500/40 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    Describe any physical symptoms or health concerns to begin AI triage.
                  </p>
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
                  placeholder="Describe your symptom, timeline, or ask questions..."
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
                <span>Emergency: For throat swelling, breathing distress, or severe trauma, call 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};