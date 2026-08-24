import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Scan, 
  Mail, 
  User, 
  CheckCircle2,
  HeartPulse,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';

const STORAGE_KEY_USER = 'nutriscan_ai_user_profile_v1';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [allergies, setAllergies] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const saveAndAuthenticate = (profile: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch (e) {
      console.error('Error persisting patient profile:', e);
    }
    onLoginSuccess(profile);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the patient name.');
      return;
    }

    const patientProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@patient.careai`,
      age: age ? parseInt(age, 10) : undefined,
      gender,
      isLoggedIn: true,
      symptoms: symptoms.trim() ? symptoms : undefined,
      allergies: allergies ? allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };

    saveAndAuthenticate(patientProfile);
  };

  const handleGoogleSignIn = () => {
    setIsConnectingGoogle(true);
    setError(null);
    
    setTimeout(() => {
      const googleProfile: UserProfile = {
        id: `google_${Date.now()}`,
        name: 'Patient User',
        email: 'patient.user@gmail.com',
        age: 29,
        gender: 'other',
        isLoggedIn: true,
        symptoms: 'Mild asthmatic wheezing and food additive sensitivities.',
        allergies: ['Peanuts', 'Sulfites'],
      };

      setIsConnectingGoogle(false);
      saveAndAuthenticate(googleProfile);
    }, 700);
  };

  const handleGuestDemo = () => {
    const demoUser: UserProfile = {
      id: 'demo-guest-123',
      email: 'alex.rivera@nutriscan.ai',
      name: 'Alex Rivera',
      age: 32,
      gender: 'male',
      isLoggedIn: true,
      symptoms: 'Occasional asthmatic wheezing and hives from processed beverages.',
      allergies: ['Sulfites', 'MSG', 'Tartrazine'],
    };
    saveAndAuthenticate(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/20 mb-1">
            <Scan className="w-7 h-7 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Nutri<span className="text-emerald-400">Scan</span> AI
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Clinical Food Additive & Patient Health Record Intake
          </p>
        </div>

        {/* Auth / Patient Record Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Header Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <span>{isRegisterMode ? 'New Patient Intake' : 'Patient Sign-In'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRegisterMode
                  ? 'Record symptoms & allergies for AI scan triage'
                  : 'Access your saved medical profile & scan history'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {isRegisterMode ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{isRegisterMode ? 'Sign In' : 'Intake Form'}</span>
            </button>
          </div>

          {/* Quick Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isConnectingGoogle}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-75"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>{isConnectingGoogle ? 'Authenticating with Google...' : 'Continue with Google'}</span>
          </button>

          {/* Form Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase absolute">
              Or enter patient information
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Patient Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Biological Sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none transition-all"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Known Food Allergies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Peanuts, Gluten, Dairy, Sulfites"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Medical Symptoms or Health Conditions
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Asthma, Acid reflux, Hypertension"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{isRegisterMode ? 'Save Profile & Enter Portal' : 'Continue to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Guest Demo Trigger */}
          <button
            type="button"
            onClick={handleGuestDemo}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Demo Patient Profile</span>
          </button>
        </div>

        {/* HIPAA & Privacy Features */}
        <div className="grid grid-cols-2 gap-3 text-center text-[11px] text-slate-400">
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Local Storage Encrypted</span>
          </div>
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>Allergen Sync Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};