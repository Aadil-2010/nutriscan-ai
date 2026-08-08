import React, { useState } from 'react';
import { UserPreferences } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences & { customSensitivities?: string[] };
  setPreferences: React.Dispatch<React.SetStateAction<any>>;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences,
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    const newSensitivity = customInput.trim();
    setPreferences((prev: any) => ({
      ...prev,
      customSensitivities: [...(prev.customSensitivities || []), newSensitivity],
    }));
    setCustomInput('');
  };

  const handleRemoveCustom = (index: number) => {
    setPreferences((prev: any) => ({
      ...prev,
      customSensitivities: (prev.customSensitivities || []).filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white">Health Sensitivity Filters</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Customize your biological sensitivity profile. NutriScan AI will automatically prioritize specific mechanism warnings during evaluations.
        </p>

        {/* Preset Checkboxes */}
        <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
          <label
            onClick={() => togglePreference('asthmaSulfiteAlert')}
            className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3.5 transition ${
              preferences.asthmaSulfiteAlert
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(preferences.asthmaSulfiteAlert)}
              readOnly
              className="mt-1 rounded accent-emerald-500"
            />
            <div>
              <div className="font-bold text-sm text-slate-200">Asthma & Sulfite Sensitivity Watch</div>
              <div className="text-xs text-slate-400">Highlights E220-E228 antimicrobial preservatives.</div>
            </div>
          </label>

          <label
            onClick={() => togglePreference('gutHealthFocus')}
            className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3.5 transition ${
              preferences.gutHealthFocus
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(preferences.gutHealthFocus)}
              readOnly
              className="mt-1 rounded accent-emerald-500"
            />
            <div>
              <div className="font-bold text-sm text-slate-200">Gut Microbiota & Enzyme Defense</div>
              <div className="text-xs text-slate-400">Flags artificial emulsifiers that alter microbiome balance.</div>
            </div>
          </label>

          <label
            onClick={() => togglePreference('kidsSafetyFocus')}
            className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3.5 transition ${
              preferences.kidsSafetyFocus
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(preferences.kidsSafetyFocus)}
              readOnly
              className="mt-1 rounded accent-emerald-500"
            />
            <div>
              <div className="font-bold text-sm text-slate-200">Children's Hyperactivity Watch</div>
              <div className="text-xs text-slate-400">Flags synthetic azo dyes under EU warning standards.</div>
            </div>
          </label>

          <label
            onClick={() => togglePreference('fssaiIndiaFocus')}
            className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3.5 transition ${
              preferences.fssaiIndiaFocus
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(preferences.fssaiIndiaFocus)}
              readOnly
              className="mt-1 rounded accent-emerald-500"
            />
            <div>
              <div className="font-bold text-sm text-slate-200">FSSAI Permitted Concentration Benchmarks</div>
              <div className="text-xs text-slate-400">Cross-references Indian regulatory ppm limits.</div>
            </div>
          </label>
        </div>

        {/* Custom Allergy / Sensitivity Input */}
        <div className="mt-5 border-t border-slate-800 pt-4">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Add Custom Allergen or Ingredient Flag
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g., Peanut Allergy, Lactose, MSG, Soy"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleAddCustom}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
            >
              Add
            </button>
          </div>

          {/* Render Active Custom Badges */}
          {preferences.customSensitivities && preferences.customSensitivities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {preferences.customSensitivities.map((item: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-2.5 py-1 text-xs font-medium text-emerald-300"
                >
                  {item}
                  <button
                    onClick={() => handleRemoveCustom(idx)}
                    className="hover:text-red-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 hover:bg-emerald-400"
          >
            Save Filters & Close
          </button>
        </div>
      </div>
    </div>
  );
};