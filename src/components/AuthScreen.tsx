import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, Sparkles, ArrowRight, Scan, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isRegisterMode && !name) {
      setError('Please enter your full name to create an account.');
      return;
    }

    const userProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      email: email,
      name: isRegisterMode ? name : email.split('@')[0] || 'User',
      isLoggedIn: true,
      symptoms: '',
    };

    onLoginSuccess(userProfile);
  };

  const handleGuestDemo = () => {
    const demoUser: UserProfile = {
      id: 'demo-guest-123',
      email: 'demo.user@nutriscan.ai',
      name: 'Alex Rivera',
      isLoggedIn: true,
      symptoms: 'Occasional asthmatic wheezing and hives from processed beverages.',
    };
    onLoginSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/20 mb-1">
            <Scan className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Nutri<span className="text-emerald-400">Scan</span> AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Scientific Food Additive & Medical Report AI Analyzer
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-5">
          {/* Toggle Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isRegisterMode ? (
                  <>
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    Create New Account
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-emerald-400" />
                    Account Login
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRegisterMode
                  ? 'Register to save custom medical reports & symptoms'
                  : 'Sign in to access your AI health sensitivity profile'}
              </p>
            </div>

            {/* Mode Toggle Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
              }}
              title={isRegisterMode ? 'Switch to Login' : 'Switch to Register'}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 transition-all flex items-center justify-center space-x-1 min-h-[40px] text-xs font-semibold"
            >
              {isRegisterMode ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Register</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
            >
              <span>{isRegisterMode ? 'Complete Registration' : 'Sign In To NutriScan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Switch Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
            >
              {isRegisterMode ? (
                <>
                  Already have an account? <span className="font-semibold text-emerald-400 underline">Log In</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  Not registered yet? <span className="font-semibold text-emerald-400 underline">Register Now</span>
                </>
              )}
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-slate-900 px-2 text-slate-500">Instant Demo Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuestDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs transition-all flex items-center justify-center space-x-2 min-h-[40px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Continue as Guest / Demo Mode</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 text-center text-[11px] text-slate-400">
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>HIPAA Private Medical Scans</span>
          </div>
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>PDF Health Report AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
