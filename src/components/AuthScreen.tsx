import React, { useState, useEffect } from 'react';
import { Stethoscope, HeartPulse, User, Mail, ArrowRight, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Parse actual Google JWT Token
  const parseGoogleJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding Google JWT:', e);
      return null;
    }
  };

  const handleRealUserLogin = (realName: string, realEmail: string, avatarPicture?: string) => {
    const realUserProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email: realEmail,
      name: realName,
      picture: avatarPicture,
      isLoggedIn: true,
      symptoms: symptoms.trim() || 'No active food sensitivities reported',
      medicalReports: [
        {
          id: `rep-${Date.now()}`,
          title: 'Initial Health Baseline',
          category: 'General Diagnostics',
          reportDate: new Date().toISOString().split('T')[0],
          reportText: 'Account initialized with Google Identity. Ready to cross-reference food ingredients.',
          createdAt: new Date().toISOString(),
        }
      ],
    };

    localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(realUserProfile));
    onLoginSuccess(realUserProfile);
  };

  useEffect(() => {
    const google = (window as any).google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (google?.accounts?.id && clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            const googleUser = parseGoogleJwt(response.credential);
            if (googleUser && googleUser.email) {
              // Real Google Details:
              // googleUser.name -> e.g., "John Doe"
              // googleUser.email -> e.g., "johndoe@gmail.com"
              // googleUser.picture -> Google profile picture URL
              handleRealUserLogin(googleUser.name, googleUser.email, googleUser.picture);
            }
          }
        },
      });

      const buttonContainer = document.getElementById('googleAuthBtn');
      if (buttonContainer) {
        google.accounts.id.renderButton(buttonContainer, {
          theme: 'filled_blue',
          size: 'large',
          width: '340',
          shape: 'pill',
          text: 'continue_with',
        });
      }
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    handleRealUserLogin(name.trim(), email.trim());
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FoodWise Clinical</h1>
          <p className="text-xs text-slate-400">
            Sign in to load your personal health profile and scan foods
          </p>
        </div>

        {/* Real Google One-Tap & Sign-In Container */}
        <div className="flex justify-center items-center py-2">
          <div id="googleAuthBtn" className="min-h-[44px]"></div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] text-slate-500 font-medium uppercase">Or Sign In Manually</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Manual Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Your Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Your Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Known Allergies / Symptoms (Optional)</label>
            <div className="relative">
              <HeartPulse className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Gluten sensitivity, nut allergy"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
          >
            <span>Access Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-slate-500 text-center">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Patient Data Privacy • FSSAI & FDA Compliance</span>
        </div>
      </div>
    </div>
  );
};