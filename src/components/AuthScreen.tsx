import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  HeartPulse, 
  User, 
  Mail, 
  ArrowRight, 
  Lock, 
  UserPlus, 
  LogIn, 
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  doc, 
  setDoc, 
  getDoc 
} from '../firebase';

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('None');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync profile to cloud database (Firestore) & Local Storage
  const syncProfileToCloud = async (
    userId: string, 
    userEmail: string, 
    userName: string, 
    avatarPicture?: string
  ) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);

      let finalProfile: UserProfile;

      if (docSnap.exists() && tab === 'login') {
        // Retrieve existing cloud data across other devices
        finalProfile = docSnap.data() as UserProfile;
        finalProfile.isLoggedIn = true;
      } else {
        // Create new patient record
        finalProfile = {
          id: userId,
          email: userEmail,
          name: userName,
          picture: avatarPicture || '',
          isLoggedIn: true,
          symptoms: symptoms.trim() || 'No active acute symptoms recorded',
          medicalReports: [
            {
              id: `rep-${Date.now()}`,
              title: tab === 'register' ? 'New Patient Intake Record' : 'Verified Health Baseline',
              category: 'General Diagnostics',
              reportDate: new Date().toISOString().split('T')[0],
              reportText: tab === 'register' && dietaryPreference !== 'None'
                ? `Dietary preference: ${dietaryPreference}. Age: ${age || 'N/A'}. Clinical profile ready for ingredient screening.`
                : 'Account ready for food safety & additive scanning.',
              createdAt: new Date().toISOString(),
            }
          ],
        };

        // Write to Cloud Firestore
        await setDoc(userDocRef, finalProfile, { merge: true });
      }

      localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(finalProfile));
      onLoginSuccess(finalProfile);
    } catch (err: any) {
      console.warn('Firestore sync note:', err.message);
      // Fallback local persistence if offline
      const fallbackProfile: UserProfile = {
        id: userId,
        email: userEmail,
        name: userName,
        picture: avatarPicture || '',
        isLoggedIn: true,
        symptoms: symptoms.trim() || 'No active acute symptoms recorded',
        medicalReports: [],
      };
      localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(fallbackProfile));
      onLoginSuccess(fallbackProfile);
    }
  };

  // 1. Google One-Click Cross-Device Auth
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncProfileToCloud(
        user.uid,
        user.email || '',
        user.displayName || 'Google User',
        user.photoURL || undefined
      );
    } catch (err: any) {
      setErrorMessage(err.message?.replace('Firebase: ', '') || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email & Password Cross-Device Submit
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'register') {
        // Register in Cloud
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await syncProfileToCloud(user.uid, user.email || email.trim(), name.trim() || 'User');
      } else {
        // Sign In from any device
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await syncProfileToCloud(user.uid, user.email || email.trim(), user.displayName || email.split('@')[0]);
      }
    } catch (err: any) {
      let friendlyError = err.message?.replace('Firebase: ', '') || 'Authentication failed.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyError = 'Account not found or invalid password. Please verify your credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'This email is already registered. Please switch to "Sign In".';
      }
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FoodWise Clinical</h1>
          <p className="text-xs text-slate-400">
            {tab === 'register' 
              ? 'Create a cloud health account accessible across all devices' 
              : 'Sign in to access your saved medical profile & scans'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Cloud Google Authentication */}
        <div>
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{tab === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] text-slate-500 font-medium uppercase">
            {tab === 'register' ? 'Or Register with Email' : 'Or Sign In with Email'}
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 chars)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Registration extra clinical fields */}
          {tab === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Age</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Diet Type</label>
                  <select
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="None">Standard / None</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Known Allergies / Sensitivities
                </label>
                <div className="relative">
                  <HeartPulse className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., Peanuts, lactose, sulfites, asthma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim() || (tab === 'register' && !name.trim())}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing Cloud Session...</span>
              </>
            ) : (
              <>
                <span>{tab === 'register' ? 'Register Cloud Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-slate-500 text-center">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Multi-Device Sync • Encrypted Cloud Records</span>
        </div>
      </div>
    </div>
  );
};