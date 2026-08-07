import React from 'react';
import { X, SlidersHorizontal, AlertTriangle, ShieldCheck, Heart, User, Check, Sparkles } from 'lucide-react';
import { UserPreferences } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences,
}) => {
  if (!isOpen) return null;

  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 text-slate-100 shadow-2xl relative space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 pt-1 z-10">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <h3 className="font-bold text-base sm:text-lg text-white">Health Sensitivity Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Customize your biological sensitivity profile. NutriScan AI will automatically prioritize specific mechanism warnings and regulatory checks during evaluations.
        </p>

        {/* Options List */}
        <div className="space-y-3">
          {/* Asthma & Sulfites */}
          <div
            onClick={() => togglePreference('asthmaSulfiteAlert')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              preferences.asthmaSulfiteAlert
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 ${
              preferences.asthmaSulfiteAlert ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'border-slate-700'
            }`}>
              {preferences.asthmaSulfiteAlert && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Asthma & Sulfite Sensitivity Watch</span>
              <span className="text-xs opacity-90 block mt-0.5">
                Highlights E220-E228 antimicrobial preservatives known to induce acute bronchospasm via non-IgE mechanisms.
              </span>
            </div>
          </div>

          {/* Gut Microbiota */}
          <div
            onClick={() => togglePreference('gutHealthFocus')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              preferences.gutHealthFocus
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 ${
              preferences.gutHealthFocus ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' : 'border-slate-700'
            }`}>
              {preferences.gutHealthFocus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Gut Microbiota & Enzyme Defense</span>
              <span className="text-xs opacity-90 block mt-0.5">
                Flags artificial emulsifiers and preservatives (e.g. Carrageenan, Nitrites) that alter microbiome balance.
              </span>
            </div>
          </div>

          {/* Children Hyperactivity */}
          <div
            onClick={() => togglePreference('kidsSafetyFocus')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              preferences.kidsSafetyFocus
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 ${
              preferences.kidsSafetyFocus ? 'bg-purple-500 text-slate-950 border-purple-400 font-bold' : 'border-slate-700'
            }`}>
              {preferences.kidsSafetyFocus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Children's Hyperactivity Watch</span>
              <span className="text-xs opacity-90 block mt-0.5">
                Flags synthetic azo dyes (E102 Tartrazine, E110 Sunset Yellow) governed under EU child warning requirements.
              </span>
            </div>
          </div>

          {/* FSSAI India Standard */}
          <div
            onClick={() => togglePreference('fssaiIndiaFocus')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              preferences.fssaiIndiaFocus
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 ${
              preferences.fssaiIndiaFocus ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' : 'border-slate-700'
            }`}>
              {preferences.fssaiIndiaFocus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <div>
              <span className="font-bold text-sm text-white block">FSSAI Permitted Concentration Benchmarks</span>
              <span className="text-xs opacity-90 block mt-0.5">
                Cross-references regulatory ppm limits mandated by the Food Safety and Standards Authority of India.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            Save Filters & Close
          </button>
        </div>
      </div>
    </div>
  );
};
