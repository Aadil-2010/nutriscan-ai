import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Scan, 
  User, 
  Database, 
  Calculator, 
  BookOpen, 
  History, 
  LogOut 
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  onLogout: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
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

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Menu Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-200 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Open Mobile Menu"
      >
        <Menu className="w-5 h-5 text-emerald-400" />
      </button>

      {/* Slide-out Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dimmed Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Panel */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl z-50">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="font-extrabold text-white text-base">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
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

            {/* Drawer Footer Action */}
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
    </div>
  );
};