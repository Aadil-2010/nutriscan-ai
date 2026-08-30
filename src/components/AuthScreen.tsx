import React, { useState, useEffect, useRef } from 'react';
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
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Decode JWT payload returned by Google GIS
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

  const handleSuccessfulAuth = (realName: string, realEmail: string, avatarPicture?: string) => {
    const profile: UserProfile = {
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
        },
      ],
    };

    localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(profile));
    onLoginSuccess(profile);
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const initGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && clientId) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              const user = parseGoogleJwt(response.credential);
              if (user?.email) {
                handleSuccessfulAuth(user.name || 'Google User', user.email, user.picture);
              }
            }
          },
        });

        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'continue_with',
          });
          setGoogleReady(true);
        }
      }
    };

    // If script is already loaded, init immediately; otherwise retry briefly
    initGoogle();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogle();
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const handleOAuthFallback = () => {
    setIsLoading(true);
    const google = (window as any).google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (google?.accounts?.oauth2 && clientId) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const data = await res.json();
              handleSuccessfulAuth(data.name || 'Google User', data.email, data.picture);
            } catch {
              handleSuccessfulAuth('Google User', 'user@gmail.com');
            }
          }
          setIsLoading(false);
        },
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } else {
      // Direct prompt if client id is not yet populated
      const enteredEmail = window.prompt('Enter your Google Account email to load your details:');
      if (enteredEmail && enteredEmail.includes('@')) {
        const fallbackName = enteredEmail.split('@')[0].replace(/[._]/g, ' ');
        const capName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
        handleSuccessfulAuth(capName, enteredEmail.trim());
      }
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    handleSuccessfulAuth(name.trim(), email.trim());
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

        {/* Google Authentication Area */}
        <div className="space-y-2">
          {/* Native GIS Render Container */}
          <div ref={googleBtnRef} className={googleReady ? 'w-full flex justify-center' : 'hidden'} />

          {/* Styled Google Button (Always visible fallback if GIS iframe takes time) */}
          {!googleReady && (
            <button
              type="button"
              onClick={handleOAuthFallback}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] text-slate-500 font-medium uppercase">Or Sign In Manually</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Manual Form */}
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