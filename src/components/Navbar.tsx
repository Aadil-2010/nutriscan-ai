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
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'scanner', label: 'Scanner', icon: Scan },
    { id: 'health-profile', label: 'Health Profile', icon: User },
    { id: 'directory', label: 'Additives DB', icon: Database },
    { id: 'calculator', label: 'ADI Calculator', icon: Calculator },
    { id: 'guide', label: 'Safety Guide', icon: BookOpen },
    { id: 'history', label: `Saved Scans (${savedCount})`, icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Section: Mobile Menu Button + Logo */}
            <div className="flex items-center space-x-3">
              {/* Green Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-2 text-emerald-400 bg-slate-900 border border-slate-800 rounded-xl flex md:hidden items-center justify-center active:scale-95 transition-transform"
                aria-label="Open Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo */}
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

            {/* Desktop Navigation (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="font-extrabold text-white text-base">Navigation Menu</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
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