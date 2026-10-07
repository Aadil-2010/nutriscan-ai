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
  Trash2,
  Loader2,
  AlertTriangle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { generateContentWithKeyFallback } from '../services/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: string;
}

const STORAGE_KEY_CHAT = 'foodsense_ai_chat_history_v11';
const QUICK_CHIPS = [
  '🚨 Allergic Reaction / Hives',
  '🫁 Asthma / Sulfite Flare-up',
  '🧪 Accidental E-Number Ingestion',
  '👶 Child Ingested Food Additive',
];

/**
 * Strips JSON wrapping, removes markdown code fences,
 * and fixes escaped newlines.
 */
function cleanAndUnwrapBotResponse(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  // Strip codeblock wrappers if any
  cleaned = cleaned.replace(/```json\s*|```\s*/gi, '').trim();

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);

      if (typeof parsed.response === 'string') return parsed.response;
      if (typeof parsed.message === 'string') return parsed.message;
      if (typeof parsed.text === 'string') return parsed.text;

      let combined = '';
      if (parsed.clinical_impression) combined += `**Clinical Impression:**\n${parsed.clinical_impression}\n\n`;
      if (Array.isArray(parsed.potential_factors_triggers)) {
        combined += `**Potential Factors & Triggers:**\n` + parsed.potential_factors_triggers.map((t: string) => `• ${t}`).join('\n') + '\n\n';
      }
      if (Array.isArray(parsed.recommended_next_steps_first_aid)) {
        combined += `**Practical First Aid & Immediate Steps:**\n` + parsed.recommended_next_steps_first_aid.map((s: string) => `• ${s}`).join('\n') + '\n\n';
      }
      if (Array.isArray(parsed.when_to_seek_immediate_care)) {
        combined += `**When to Seek Emergency Care:**\n` + parsed.when_to_seek_immediate_care.map((c: string) => `• ${c}`).join('\n') + '\n\n';
      }
      if (parsed.emergency_instruction) {
        combined += `🚨 **Emergency Notice:** ${parsed.emergency_instruction}`;
      }

      if (combined.trim()) return combined.trim();
    } catch {
      // Not JSON, continue below
    }
  }

  // Replace literal string "\n" with real newlines
  return cleaned.replace(/\\n/g, '\n');
}

/**
 * Parses inline **bold text** into styled glowing pills
 */
function parseInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={index}
          className="font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 mx-0.5"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Visual Markdown & Alert Renderer Component
 */
const FormattedMessageText: React.FC<{ content: string }> = ({ content }) => {
  const cleanContent = cleanAndUnwrapBotResponse(content);
  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-2.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Emergency & Red-Flag Warnings
        if (
          trimmed.toLowerCase().includes('emergency care') ||
          trimmed.toLowerCase().includes('emergency notice') ||
          trimmed.startsWith('🚨')
        ) {
          return (
            <div
              key={idx}
              className="p-3 my-2 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 font-medium flex flex-col gap-1 shadow-sm"
            >
              <span className="text-[10px] font-black tracking-wider uppercase text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 inline" /> Critical Emergency Notice
              </span>
              <span>{parseInlineStyles(trimmed.replace(/^#+\s*|\*+/g, ''))}</span>
            </div>
          );
        }

        // Section Badges (Clinical Impression, Triggers, Steps)
        if (
          trimmed.startsWith('Clinical Impression:') ||
          trimmed.startsWith('Potential Triggers') ||
          trimmed.startsWith('Potential Factors') ||
          trimmed.startsWith('Practical First Aid') ||
          trimmed.startsWith('**Clinical Impression') ||
          trimmed.startsWith('**Potential Triggers') ||
          trimmed.startsWith('**Potential Factors') ||
          trimmed.startsWith('**Practical First Aid')
        ) {
          return (
            <div key={idx} className="pt-2">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-extrabold text-[11px] uppercase tracking-wide border border-emerald-500/30 shadow-sm">
                {trimmed.replace(/\*\*/g, '').replace(':', '')}
              </span>
            </div>
          );
        }

        // Bullet Point Formatting
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 font-bold text-sm leading-none mt-0.5">•</span>
              <span className="text-slate-200 leading-normal">
                {parseInlineStyles(trimmed.slice(2))}
              </span>
            </div>
          );
        }

        // Normal Body Paragraphs
        return (
          <p key={idx} className="text-slate-200 leading-relaxed">
            {parseInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const HealthChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
    return [];
  });

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
    setApiError(null);
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

  const generateSmartResponse = async (history: Message[]): Promise<string> => {
    let profileContext = 'None recorded';
    try {
      const savedProfile = localStorage.getItem('nutriscan_ai_user_profile_v1');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        profileContext = `
Patient Health Profile Context:
- Patient Name: ${parsed.name || 'User'}
- Diagnosed Sensitivities / Allergies: ${Array.isArray(parsed.symptoms) ? parsed.symptoms.join(', ') : (parsed.symptoms || 'None')}
- Medical Records / Diagnostic Reports: ${parsed.medicalReports?.map((r: any) => `${r.title}:${r.reportText}`).join('; ') || 'None'}
`;
      }
    } catch (e) {
      console.warn('Could not read user profile context for chat:', e);
    }

    const systemInstruction = `
You are FoodSense Clinical AI, an expert medical triage assistant, clinical nutritionist, toxicologist, and first-aid guide.

CRITICAL FORMATTING INSTRUCTIONS:
- You are speaking directly to a patient. NEVER return raw JSON code blocks or curly braces {}.
- Structure your response using these exact plain text headings:
  Clinical Impression:
  Potential Triggers & Additives:
  Practical First Aid & Immediate Steps:
  When to Seek Emergency Care:
- Use bullet points (- ) for actionable advice.
- Use bolding (**term**) for important terms and warnings.
- If symptoms indicate anaphylaxis, airway closure, or severe respiratory distress, immediately instruct emergency care (112 / 911).

${profileContext}
`;

    const parts: any[] = [];
    const conversationHistoryText = history
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    parts.push({ text: `Conversation History:\n${conversationHistoryText}` });

    const latestMsg = history[history.length - 1];
    if (latestMsg?.image && latestMsg.image.includes(',')) {
      const mimeType = latestMsg.image.split(';')[0].replace('data:', '') || 'image/jpeg';
      const cleanBase64 = latestMsg.image.split(',')[1];
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const responseText = await generateContentWithKeyFallback(
      systemInstruction,
      parts,
      0.2,
      1500
    );

    return cleanAndUnwrapBotResponse(responseText);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if ((!textToSend && !selectedImage) || loading) return;

    const userText = textToSend || (selectedImage ? 'Please evaluate this symptom / packaging photo for clinical markers and risks.' : '');
    const currentImg = selectedImage;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      image: currentImg || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory: Message[] = [...messages, newMsg];
    setMessages(updatedHistory);
    setInput('');
    setSelectedImage(null);
    setLoading(true);
    setApiError(null);

    try {
      const aiReply = await generateSmartResponse(updatedHistory);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedHistory, botMsg]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const errorMsg = (err?.message || '').toLowerCase();
      
      let displayError = 'Failed to complete triage request. Please try again.';
      if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('unavailable')) {
        displayError = 'The AI clinical servers are currently handling high traffic. Please retry in a few seconds.';
      } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        displayError = 'Daily AI safety quota exceeded. Switching to backup server pool...';
      }
      setApiError(displayError);
      setMessages([
        ...updatedHistory,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I encountered temporary high server traffic. If you or someone with you is experiencing severe symptoms (throat tightening, breathing difficulty, or anaphylaxis), please seek emergency care (112 / 911) immediately.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Activator */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-full shadow-xl shadow-emerald-500/25 flex items-center justify-center active:scale-90 transition-all cursor-pointer group"
        aria-label="Open Health Assistant"
        title="Open FoodSense Clinical Assistant"
      >
        <Bot className="w-6 h-6 transition-transform group-hover:scale-110" />
      </button>

      {/* Main Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg h-[92vh] sm:h-[640px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    FoodSense Clinical AI
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3" /> Multi-Key Active
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-slate-400">Symptom evaluation, photo triage & first aid</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Reset conversation"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
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
                <div className="text-center py-8 px-4 space-y-4 text-slate-500">
                  <HeartPulse className="w-12 h-12 text-emerald-500/40 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">How can I assist your health today?</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Describe your symptoms, ask about safe food additive thresholds, or upload a photo of a skin rash.
                    </p>
                  </div>

                  <div className="pt-2 space-y-1.5 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Common Inquiries</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {QUICK_CHIPS.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(chip)}
                          className="w-full text-left p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-500/10 border border-slate-700/60 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate">{chip}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none shadow-md shadow-emerald-950/30'
                        : 'bg-slate-800/95 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-md'
                    }`}
                  >
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Uploaded symptom" 
                        className="rounded-xl max-h-48 w-auto object-cover border border-slate-700/50 mb-2"
                      />
                    )}

                    {msg.role === 'assistant' ? (
                      <FormattedMessageText content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                    )}

                    <div className={`text-[9px] mt-1 text-right ${msg.role === 'user' ? 'text-slate-800' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Analyzing clinical scenario & image...</span>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Controls */}
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
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-400 text-white p-0.5 rounded-full shadow cursor-pointer"
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
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 rounded-xl transition-all cursor-pointer flex-shrink-0"
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
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition-all cursor-pointer font-bold flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <PhoneCall className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span>Emergency: For throat swelling or severe breathing difficulty, call 112 / 911 immediately.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};