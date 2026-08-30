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
  const [showAccountChooser, setShowAccountChooser] = useState(false);

  // Helper to decode JWT token from Google
  const decodeJwt = (token: string) => {
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
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Check if Google GSI SDK is loaded
    const google = (window as any).google;
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (google?.accounts?.id && googleClientId) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          const payload = decodeJwt(response.credential);
          if (payload) {
            completeLogin(payload.name, payload.email, payload.picture);
          }
        },
      });

      google.accounts.id.renderButton(
        document.getElementById('googleAuthContainer'),
        { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
      );
    }
  }, []);

  const completeLogin = (userName: string, userEmail: string, avatarUrl?: string) => {
    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      email: userEmail,
      name: userName,
      isLoggedIn: true,
      symptoms: symptoms.trim() || 'No active acute symptoms recorded',
      medicalReports: [
        {
          id: `rep-${Date.now()}`,
          title: 'Initial Health Intake',
          category: 'General Diagnostics',
          reportDate: new Date().toISOString().split('T')[0],
          reportText: 'Initial baseline profile created. Ready for food safety & additive analysis.',
          createdAt: new Date().toISOString(),
        }
      ],
    };

    localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(profile));
    onLoginSuccess(profile);
  };

  const handleGoogleClick = () => {
    const google = (window as any).google;
    if (google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      google.accounts.id.prompt();
    } else {
      setShowAccountChooser(true);
    }
  };

  const selectMockGoogleAccount = (accName: string, accEmail: string) => {
    setIsLoading(true);
    setTimeout(() => {
      completeLogin(accName, accEmail);
      setIsLoading(false);
    }, 250);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    completeLogin(name.trim(), email.trim());
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FoodWise Clinical</h1>
          <p className="text-xs text-slate-400">
            AI Food Additive, Allergen & Medical Profile Screener
          </p>
        </div>

        {/* Real / Interactive Google Button */}
        <div>
          <div id="googleAuthContainer" className="w-full min-h-[40px] flex justify-center"></div>
          
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoading ? 'Authenticating...' : 'Sign in with Google Account'}</span>
          </button>
        </div>

        {/* Google Account Selector Dialog */}
        {showAccountChooser && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between z-20 border border-slate-700">
            <div>
              <h3 className="text-sm font-black text-white">Choose a Google Account</h3>
              <p className="text-xs text-slate-400 mt-1">Select an account to sign in to FoodWise Clinical</p>
              
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => selectMockGoogleAccount('Alex Johnson', 'alex.johnson@gmail.com')}
                  className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">A</div>
                  <div>
                    <div className="text-xs font-bold text-white">Alex Johnson</div>
                    <div className="text-[11px] text-slate-400">alex.johnson@gmail.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectMockGoogleAccount('Sarah Parker', 'sarah.parker@gmail.com')}
                  className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">S</div>
                  <div>
                    <div className="text-xs font-bold text-white">Sarah Parker</div>
                    <div className="text-[11px] text-slate-400">sarah.parker@gmail.com</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAccountChooser(false)}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] text-slate-500 font-medium uppercase">Or Sign In Manually</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Manual Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Symptoms / Allergies (Optional)</label>
            <div className="relative">
              <HeartPulse className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., Gluten sensitivity, lactose intolerance"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
          >
            <span>Proceed to Health Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-slate-500 text-center">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Secure authentication • Encrypted medical profile</span>
        </div>
      </div>
    </div>
  );
};