import React from 'react';
import { 
  Scan, 
  BookOpen, 
  Calculator, 
  History, 
  SlidersHorizontal,
  Info,
  Stethoscope,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'scanner' | 'health-profile' | 'directory' | 'calculator' | 'guide' | 'history';
  setActiveTab: (tab: 'scanner' | 'health-profile' | 'directory' | 'calculator' | 'guide' | 'history') => void;
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
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & App Name */}
            <div 
              className="flex items-center space-x-2.5 cursor-pointer select-none" 
              onClick={() => setActiveTab('scanner')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <Scan className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-sans block leading-tight">
                  Nutri<span className="text-emerald-400">Scan</span> AI
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Scientific Food Ingredient & Additive Engine
                </p>
              </div>
            </div>

            {/* Desktop / Tablet Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
              <button
                id="nav-tab-scanner"
                onClick={() => setActiveTab('scanner')}
                className={`flex items-center space-x-1.5 md:px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'scanner'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Scan className="w-4 h-4 flex-shrink-0" />
                <span>Analyzer</span>
              </button>

              <button
                id="nav-tab-health-profile"
                onClick={() => setActiveTab('health-profile')}
                className={`flex items-center space-x-1.5 md:px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all relative ${
                  activeTab === 'health-profile'
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Stethoscope className="w-4 h-4 flex-shrink-0 text-teal-400" />
                <span>Medical Reports</span>
                {userProfile.medicalReportFileName && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                )}
              </button>

              <button
                id="nav-tab-directory"
                onClick={() => setActiveTab('directory')}
                className={`flex items-center space-x-1.5 md:px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'directory'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span>E-Numbers</span>
              </button>

              <button
                id="nav-tab-calculator"
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center space-x-1.5 md:px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-4 h-4 flex-shrink-0" />
                <span>ADI Calc</span>
              </button>

              <button
                id="nav-tab-guide"
                onClick={() => setActiveTab('guide')}
                className={`flex items-center space-x-1.5 md:px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'guide'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Guide</span>
              </button>

              <button
                id="nav-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 md:px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs bg-emerald-500 text-slate-950 font-bold">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>

            {/* User Profile & Health Filters Controls */}
            <div className="flex items-center space-x-2">
              <button
                id="health-filters-btn"
                onClick={openPreferencesModal}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors relative min-h-[38px]"
                title="Configure Health Sensitivities & Standards"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="whitespace-nowrap hidden sm:inline">Filters</span>
                {activePreferenceCount > 0 && (
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                    {activePreferenceCount}
                  </span>
                )}
              </button>

              {/* User Account & Logout button */}
              <div className="flex items-center pl-1 border-l border-slate-800 space-x-1.5">
                <button
                  onClick={() => setActiveTab('health-profile')}
                  className="flex items-center space-x-1.5 px-2 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium transition-colors"
                  title="View Health Profile"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span className="max-w-[80px] sm:max-w-[110px] truncate text-slate-200 hidden sm:inline">
                    {userProfile.name}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all min-h-[48px] ${
            activeTab === 'scanner'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scan className="w-4 h-4 mb-0.5" />
          <span>Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('health-profile')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all relative ${
            activeTab === 'health-profile'
              ? 'text-teal-400 font-bold bg-teal-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4 mb-0.5 text-teal-400" />
          <span>Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all ${
            activeTab === 'directory'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>E-Numbers</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all ${
            activeTab === 'calculator'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4 mb-0.5" />
          <span>ADI Calc</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all relative ${
            activeTab === 'history'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <History className="w-4 h-4 mb-0.5" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] px-1 rounded-full">
                {savedCount}
              </span>
            )}
          </div>
          <span>Saved</span>
        </button>
      </nav>
    </>
  );
};

