import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  User, 
  History, 
  BookOpen, 
  Calculator, 
  Database,
  Menu,
  X,
  LogOut,
  Scan
} from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Group: Mobile Menu Button + Brand Logo */}
            <div className="flex items-center space-x-3">
              {/* Mobile Hamburger Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-200 bg-slate-900 border border-slate-800 rounded-xl md:hidden flex items-center justify-center active:scale-95 transition-all"
                aria-label="Toggle Mobile Menu"
              >
                <Menu className="w-5 h-5 text-emerald-400" />
              </button>

              {/* Brand Logo */}
              <div
                onClick={() => setActiveTab('scanner')}
                className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
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

            {/* Desktop Navigation Links */}
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

            {/* Header Right Action Bar */}
            <div className="flex items-center space-x-2">
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

      {/* Slide-out Navigation Drawer for Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Dimmed Overlay Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="font-extrabold text-white text-base">Navigation Menu</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu List */}
              <div className="space-y-2">
                <button
                  onClick={() => handleMobileTabClick('scanner')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'scanner'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Scan className="w-4 h-4 text-emerald-400" />
                  <span>Scanner</span>
                </button>

                <button
                  onClick={() => handleMobileTabClick('health-profile')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'health-profile'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Health Profile</span>
                </button>

                <button
                  onClick={() => handleMobileTabClick('directory')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'directory'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Additives DB</span>
                </button>

                <button
                  onClick={() => handleMobileTabClick('calculator')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'calculator'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>ADI Calculator</span>
                </button>

                <button
                  onClick={() => handleMobileTabClick('guide')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'guide'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Safety Guide</span>
                </button>

                <button
                  onClick={() => handleMobileTabClick('history')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'history'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Saved Scans ({savedCount})</span>
                </button>
              </div>
            </div>

            {/* Mobile Footer Logout Button */}
            <div className="border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};