import React from 'react';
import { 
  SlidersHorizontal, 
  User, 
  History, 
  BookOpen, 
  Calculator, 
  Database,
  Scan,
  LogOut
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
  const navTabs = [
    { id: 'scanner', label: 'Scanner', icon: Scan },
    { id: 'health-profile', label: 'Health Profile', icon: User },
    { id: 'directory', label: 'Additives DB', icon: Database },
    { id: 'calculator', label: 'ADI Calc', icon: Calculator },
    { id: 'guide', label: 'Safety Guide', icon: BookOpen },
    { id: 'history', label: `Saved (${savedCount})`, icon: History },
  ];

  return (
    <>
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
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
                <span className="text-[10px] text-slate-400 block -mt-1 font-medium">Food Additive & Allergen Engine</span>
              </div>
            </div>

            {/* Top Right Controls (Filters + Logout) */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={openPreferencesModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-all"
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
                className="text-xs text-slate-400 hover:text-rose-400 font-semibold px-2 py-1 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* FIXED BOTTOM NAVIGATION BAR - FORCED VISIBLE ON MOBILE & SMALL SCREENS */}
      <div 
        style={{ display: 'block !important', visibility: 'visible !important' }} 
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 px-2 py-2 shadow-2xl"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all flex-shrink-0 ${
                  isActive
                    ? 'text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[10px] leading-tight whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};