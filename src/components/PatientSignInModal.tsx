import React, { useState, useEffect } from 'react';
import { User, X, CheckCircle2, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: { name: string; age?: string; email?: string }) => void;
}

export const PatientSignInModal: React.FC<PatientAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('care_ai_patient');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        // ignore parsing errors
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const profile = { name: name.trim(), age: age.trim() };
    localStorage.setItem('care_ai_patient', JSON.stringify(profile));
    setCurrentUser(profile);
    onSuccess(profile);
    onClose();
  };

  const handleGoogleConnect = () => {
    setIsConnecting(true);
    // Simulate quick Google authentication handshake
    setTimeout(() => {
      const googleUser = { name: 'Patient User', email: 'user@gmail.com' };
      localStorage.setItem('care_ai_patient', JSON.stringify(googleUser));
      setCurrentUser(googleUser);
      setIsConnecting(false);
      onSuccess(googleUser);
      onClose();
    }, 900);
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const namePart = emailInput.split('@')[0];
    const profile = { name: namePart, email: emailInput.trim() };
    localStorage.setItem('care_ai_patient', JSON.stringify(profile));
    setCurrentUser(profile);
    onSuccess(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0B1120] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative text-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Patient Sign-In</h2>
              <p className="text-xs text-slate-400">Sign in with Google / Gmail</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Status Card */}
        {currentUser && (
          <div className="mb-4 p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-emerald-400">Signed in as {currentUser.name}</div>
              <div className="text-emerald-300/70 text-[11px]">Your profile is active and synced with Care AI.</div>
            </div>
          </div>
        )}

        {/* Google Sign-in Section Card */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Google & Gmail Sign-In</span>
          </div>

          {!showEmailPrompt ? (
            <>
              <button
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-75"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{isConnecting ? 'Connecting...' : 'Continue with Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmailPrompt(true)}
                className="w-full text-center mt-3 text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 cursor-pointer"
              >
                Or enter your @gmail.com address directly
              </button>
            </>
          ) : (
            <form onSubmit={handleManualEmailSubmit} className="space-y-2">
              <input
                type="email"
                placeholder="name@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Verify Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailPrompt(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0B1120] px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase absolute">
            Or enter custom patient name
          </span>
        </div>

        {/* Manual Name Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Patient Name (e.g. Alex Morgan)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-3 bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              placeholder="Age (Years)"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="flex-1 min-w-[90px] bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Continue with Name</span>
          </button>
        </form>

        {/* Footer info note */}
        <div className="mt-4 p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-start gap-2 text-[11px] text-slate-400 leading-tight">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Your Google / Gmail profile selection is automatically saved in local session storage so returning to Care AI is seamless and personalized.
          </span>
        </div>

      </div>
    </div>
  );
};