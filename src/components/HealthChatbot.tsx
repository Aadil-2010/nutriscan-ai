import React, { useState, useRef, useEffect } from 'react';
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
  image?: string;
}

const STORAGE_KEY_CHAT = 'foodwise_ai_chat_history_v7';

const SYSTEM_INSTRUCTION = `You are FoodWise Clinical AI, an empathetic, highly knowledgeable medical triage assistant.

CRITICAL INSTRUCTIONS:
1. Provide a completely dynamic, nuanced clinical evaluation based on everything the user says or shows in photos. Never respond with canned, repetitive scripts.
2. If the user presents a physical symptom (swelling, numbness, burning, rash, sharp pain, trauma), immediately address that physical issue.
3. If an image is provided, examine it visually and reference what you observe (e.g., color, borders, swelling severity, skin texture).
4. Output format:
   - **Suspected Condition**: Give 2-3 most probable clinical possibilities.
   - **Recommended Specialist**: Name the exact doctor specialist to consult.
   - **Immediate First-Aid Protocol**: Provide 3-4 clear, actionable numbered steps tailored strictly to their exact situation.
   - **Emergency Red Flags**: State any warning signs requiring immediate 911 / ER attention.
5. If the user asks a natural follow-up question or conversational remark, answer naturally in continuous context without restarting the questionnaire.
Keep your response concise, clear, and structured with Markdown.`;

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

  const callLiveAI = async (chatHistory: Message[]): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // Convert messages into Gemini REST API format
    const contents = chatHistory.map((m) => {
      const parts: any[] = [{ text: m.content || '' }];

      if (m.image && m.image.includes(',')) {
        const mimeType = m.image.split(';')[0].replace('data:', '');
        const base64Data = m.image.split(',')[1];
        parts.push({
          inline_data: {
            mime_type: mimeType || 'image/jpeg',
            data: base64Data,
          },
        });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    // Primary: Direct Gemini 2.5 Flash REST API
    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply && reply.trim().length > 0) {
            return reply.trim();
          }
        }
      } catch (err) {
        console.warn('Direct Gemini call failed, routing to serverless fallback...', err);
      }
    }

    // Secondary: Serverless Multi-Turn AI Stream (Zero-Key LLM Router)
    const openAiPayload = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...chatHistory.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const routerResp = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: openAiPayload,
        model: 'openai',
        temperature: 0.3,
      }),
    });

    if (routerResp.ok) {
      const text = await routerResp.text();
      if (text && text.trim().length > 10) {
        return text.trim();
      }
    }

    throw new Error('AI service unreachable. Please verify your connection.');
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userText = input.trim() || (selectedImage ? 'Attached photo for symptom evaluation.' : '');
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
      const aiReply = await callLiveAI(updatedHistory);
      setMessages([...updatedHistory, { role: 'assistant', content: aiReply }]);
    } catch (err: any) {
      setMessages([
        ...updatedHistory,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Unable to complete AI evaluation. Please try sending again in a moment.'}`,
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
                      <ShieldCheck className="w-3 h-3" /> Live LLM
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Multimodal vision triage, doctor referrals & first aid</p>
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
                    Ask any question, describe symptoms, or attach photos of a rash, wound, or swelling for live AI evaluation.
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
                        alt="Uploaded symptom" 
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
                    <span>Analyzing clinical scenario & generating dynamic response...</span>
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
                  placeholder="Ask anything, describe symptoms, or attach photos..."
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
                <span>Emergency: For throat swelling, stroke signs, or severe trauma, call 911 / 112 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};