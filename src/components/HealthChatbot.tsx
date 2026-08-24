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

const CLINICAL_SYSTEM_PROMPT = `You are FoodWise Clinical & First Aid AI, an expert medical triage assistant.

CRITICAL INSTRUCTIONS:
1. Maintain conversational memory and context across the entire chat.
2. If the user presents a symptom for the first time without context:
   - Ask clarifying questions: What foods/drinks did they have in the last 4-6 hours? What physical activity or environment were they in?
3. Once sufficient context is known or if the user asks a specific health/medical question:
   - Provide the **Suspected Condition**
   - Recommend the exact **Doctor Specialist** to consult (e.g. Allergist, Neurologist, Dermatologist, Gastroenterologist, ER)
   - Give an **Immediate First-Aid Protocol** with clear, numbered steps.
4. If the user asks a follow-up (e.g. "should I see a dermatologist?"), answer directly using the previous context without restarting the intake.
5. Keep responses concise, clinically grounded, formatted with Markdown bolding and numbered steps.`;

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build conversation payload for the AI model
      const formattedHistory = newMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
            ...formattedHistory,
          ],
          model: 'openai',
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('AI network response failed');
      }

      const aiReply = await response.text();
      setMessages([...newMessages, { role: 'assistant', content: aiReply.trim() }]);
    } catch (error) {
      console.error('AI Clinical Engine error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `**Clinical Notice:**\n\nI was unable to reach the diagnostic server. For acute symptoms, severe allergic reactions, or respiratory distress, please contact your local emergency hotline (911 / 112) or visit the nearest urgent care clinic immediately.`,
        },
      ]);
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
                      <ShieldCheck className="w-3 h-3" /> AI Online
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Live AI medical triage & specialist matching</p>
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