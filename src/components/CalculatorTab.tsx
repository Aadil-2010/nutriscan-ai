import React, { useState } from 'react';
import { Calculator, Scale, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { ADDITIVE_DIRECTORY } from '../data/additiveDirectory';

export const CalculatorTab: React.FC = () => {
  const [bodyWeightKg, setBodyWeightKg] = useState<number>(65);
  const [selectedAdditiveName, setSelectedAdditiveName] = useState<string>('Sodium Benzoate');

  const selectedAdditive = ADDITIVE_DIRECTORY.find((a) => a.name === selectedAdditiveName) || ADDITIVE_DIRECTORY[0];

  const noael = selectedAdditive.noael_mg_kg || 500;
  const adi = noael / 100; // ADI = NOAEL / 100 formula
  const personalMaxDailyMg = Math.round(adi * bodyWeightKg);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center">
          <Calculator className="w-7 h-7 mr-3 text-cyan-400" />
          Toxicology & ADI Calculator
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Calculate your personal Acceptable Daily Intake (ADI) threshold using the standard toxicological 100-fold safety factor formula: <strong className="text-emerald-400">ADI = NOAEL / 100</strong>.
        </p>
      </div>

      {/* Calculator Interactive Board */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Input Parameters Column */}
        <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center">
            <Scale className="w-5 h-5 mr-2 text-emerald-400" />
            Input Parameters
          </h3>

          {/* Body Weight Slider & Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="weight-range" className="text-sm font-semibold text-slate-200">User Body Weight</label>
              <span className="text-base font-mono font-bold text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                {bodyWeightKg} kg ({Math.round(bodyWeightKg * 2.20462)} lbs)
              </span>
            </div>
            <input
              id="weight-range"
              type="range"
              min="20"
              max="130"
              value={bodyWeightKg}
              onChange={(e) => setBodyWeightKg(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Child (20kg)</span>
              <span>Adult (65kg)</span>
              <span>130kg</span>
            </div>
          </div>

          {/* Additive Selector */}
          <div className="space-y-2">
            <label htmlFor="additive-select" className="text-sm font-semibold text-slate-200 block">Select Food Additive</label>
            <select
              id="additive-select"
              value={selectedAdditiveName}
              onChange={(e) => setSelectedAdditiveName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
            >
              {ADDITIVE_DIRECTORY.map((item, idx) => (
                <option key={idx} value={item.name}>
                  {item.ins_e_number} - {item.name} ({item.functional_class.split('/')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Additive Quick Profile */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="text-slate-400">
              Functional Class: <strong className="text-slate-200">{selectedAdditive.functional_class}</strong>
            </div>
            <div className="text-slate-400">
              FSSAI Permitted Limit: <strong className="text-emerald-400">{selectedAdditive.fssai_limit_ppm}</strong>
            </div>
          </div>
        </div>

        {/* Calculation Output Results Column */}
        <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-cyan-400" />
              Toxicological Results
            </h3>

            {/* Formula Step Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">NOAEL (Lab Animal Threshold):</span>
                <span className="font-mono font-bold text-emerald-400">{noael} mg/kg/day</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Safety Margin Factor:</span>
                <span className="font-mono font-bold text-slate-300">÷ 100-fold</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-200">ADI Formula Standard:</span>
                <span className="font-mono text-cyan-400">{adi} mg/kg/day</span>
              </div>
            </div>

            {/* Personal Max Daily Allowance Box */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-2 shadow-inner">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Your Personal Daily Safe Threshold
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white block">
                {personalMaxDailyMg} <span className="text-lg text-emerald-400 font-sans">mg / day</span>
              </span>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Estimated maximum safe daily intake over a lifetime without toxicological risk for a {bodyWeightKg}kg individual.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              The 100-fold safety factor accounts for species extrapolation from animal studies (10x) and human population variability (10x).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
