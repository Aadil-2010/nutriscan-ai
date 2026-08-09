import React from 'react';
import { BookOpen, ShieldCheck, AlertTriangle, Scale, Activity, Dna, FileCheck2, Info, ClipboardList } from 'lucide-react';

interface GuideTabProps {
  onOpenEthicalModal?: () => void;
}

export const GuideTab: React.FC<GuideTabProps> = ({ onOpenEthicalModal }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header with Framework Trigger Button */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center">
              <BookOpen className="w-7 h-7 mr-3 text-emerald-400 flex-shrink-0" />
              NutriScan AI Core Knowledge Base
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
              Comprehensive guide to food additive functional classes, biological allergy and sensitivity mechanisms, toxicological ADI standards, and global regulatory frameworks.
            </p>
          </div>

          {/* Styled Ethical & Safety Framework Button */}
          <button
            type="button"
            onClick={onOpenEthicalModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl shadow-md transition-all hover:border-emerald-500/60 active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-center flex-shrink-0"
          >
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            <span>View Ethical & Safety Framework</span>
          </button>
        </div>
      </div>

      {/* 1. Functional Classes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center border-b border-slate-800 pb-3">
          <Activity className="w-5 h-5 mr-2 text-cyan-400" />
          1. Functional Classes of Food Additives
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 text-sm block">Preservatives / Antimicrobials</span>
            <p className="leading-relaxed">
              Chemicals that kill or prevent the growth of bacteria, yeast, and molds (e.g., Sodium Benzoate / INS 211, Potassium Sorbate / INS 202).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 text-sm block">Antioxidants</span>
            <p className="leading-relaxed">
              Inhibit oxidation and oxygen reaction, preventing fats and oils from turning rancid and fruit products from turning brown (e.g., Ascorbic Acid / INS 300, TBHQ / INS 319).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400 text-sm block">Emulsifiers & Stabilizers</span>
            <p className="leading-relaxed">
              Compounds allowing water and fat to blend smoothly without separating (e.g., Soy Lecithin / INS 322, Carrageenan / INS 407).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 text-sm block">Synthetic Dyes</span>
            <p className="leading-relaxed">
              Petroleum or synthetically derived colorants added to enhance visual appeal or restore lost colors during thermal processing (e.g., Tartrazine / INS 102).
            </p>
          </div>
        </div>
      </div>

      {/* 2. Biological Mechanisms */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center border-b border-slate-800 pb-3">
          <Dna className="w-5 h-5 mr-2 text-rose-400" />
          2. Biological Mechanisms & Health Impacts
        </h3>
        <div className="space-y-3 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 text-slate-300 space-y-1">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>IgE-Mediated Immune Allergy</span>
            </div>
            <p className="leading-relaxed">
              True adaptive immune response where body mistakes proteins for hostile invaders, generating IgE antibodies. Secondary exposure triggers mast cell degranulation releasing histamine (hives, airway constriction, anaphylaxis).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 text-slate-300 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Info className="w-4 h-4" />
              <span>Non-IgE Chemical Sensitivity</span>
            </div>
            <p className="leading-relaxed">
              Reactions independent of IgE antibodies, occurring when chemical additives directly stimulate smooth muscle or cellular pathways (e.g., sulfites inducing acute bronchospasm in asthmatic individuals).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/20 text-slate-300 space-y-1">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Gut Microbiota & Enzyme Disruption</span>
            </div>
            <p className="leading-relaxed">
              Chronic high-intake exposure to synthetic emulsifiers or preservatives alters intestinal mucosal integrity, shifts commensal bacterial species diversity, or inhibits digestive metabolic enzymes.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Toxicological Standards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center border-b border-slate-800 pb-3">
          <Scale className="w-5 h-5 mr-2 text-emerald-400" />
          3. Toxicological Safety Benchmarks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <span className="font-bold text-emerald-400 text-sm block">NOAEL (No Observed Adverse Effect Level)</span>
            <p className="leading-relaxed">
              The highest chemical dosage administered in toxicological trials at which zero adverse or toxic effects are observed in animal models.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <span className="font-bold text-cyan-400 text-sm block">ADI (Acceptable Daily Intake)</span>
            <p className="leading-relaxed">
              Calculated using the standard 100-fold safety factor margin: <strong className="text-white font-mono">ADI = NOAEL / 100</strong>. Represents safe daily lifetime consumption per kilogram of body weight.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Regulatory Frameworks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center border-b border-slate-800 pb-3">
          <FileCheck2 className="w-5 h-5 mr-2 text-amber-400" />
          4. Global Regulatory Bodies & Codes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white text-sm block">INS / E-Number System</span>
            <p className="leading-relaxed">
              International numerical classification code unifying food additive names globally on commercial packaging (e.g. INS 211 = E211).
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 text-sm block">FSSAI (India)</span>
            <p className="leading-relaxed">
              Food Safety and Standards Authority of India, enforcing legal maximum permitted concentrations (ppm) in food products sold in India.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 text-sm block">FDA & EFSA</span>
            <p className="leading-relaxed">
              U.S. Food & Drug Administration and European Food Safety Authority—primary regulatory institutions evaluating toxicological safety data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};