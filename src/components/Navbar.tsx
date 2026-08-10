import React from 'react';
import { SlidersHorizontal, User, History, BookOpen, Calculator, Database } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  savedCount: number;
  openPreferencesModal: () => void;
  activePreferenceCount: number;
  userProfile: UserProfile;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  openPreferencesModal,
  activePreferenceCount,
  userProfile,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Mobile Button + Brand Logo */}
          <div className="flex items-center space-x-3">
            <MobileNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              savedCount={savedCount} 
              onLogout={onLogout} 
            />

            <div
              onClick={() => setActiveTab('scanner')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 p-2 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                  <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
                </svg>
              </div>

              <div>
                <span className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  FoodWise <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-medium hidden sm:block">Food Additive & Allergen Engine</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Scanner
            </button>

            <button
              onClick={() => setActiveTab('health-profile')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'health-profile'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Health Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Additives DB</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>ADI Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Safety Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Saved Scans ({savedCount})</span>
            </button>
          </nav>

          {/* Action Bar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={openPreferencesModal}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filters</span>
              {activePreferenceCount > 0 && (
                <span className="ml-1 bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                  {activePreferenceCount}
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-rose-400 font-semibold px-2 py-1 transition-colors hidden md:block"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};