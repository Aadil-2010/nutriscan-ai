import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen, Info, Scale, ShieldCheck } from 'lucide-react';
import { AdditiveItem } from '../types';

interface AdditiveDetailModalProps {
  additive: AdditiveItem | null;
  onClose: () => void;
}

export const AdditiveDetailModal: React.FC<AdditiveDetailModalProps> = ({ additive, onClose }) => {
  if (!additive) return null;

  const getBadgeColors = (rating: string) => {
    switch (rating) {
      case 'Safe':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Caution':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'High Concern':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getMechanismBadge = (mechanism: string) => {
    switch (mechanism) {
      case 'IgE Allergy':
        return { bg: 'bg-rose-900/30 text-rose-300 border-rose-700/50', icon: ShieldAlert, title: 'IgE-Mediated Immune Allergy Risk' };
      case 'Non-IgE Sensitivity':
        return { bg: 'bg-amber-900/30 text-amber-300 border-amber-700/50', icon: AlertTriangle, title: 'Non-IgE Chemical Sensitivity' };
      case 'Gut Microbiota impact':
        return { bg: 'bg-purple-900/30 text-purple-300 border-purple-700/50', icon: Info, title: 'Gut Microbiota & Enzyme Disruption' };
      default:
        return { bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: CheckCircle2, title: 'No Significant Adverse Mechanism' };
    }
  };

  const mechInfo = getMechanismBadge(additive.biological_mechanism);
  const MechIcon = mechInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {additive.ins_e_number}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getBadgeColors(additive.safety_rating)}`}>
                {additive.safety_rating}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">{additive.name}</h2>
            <p className="text-sm text-emerald-400/90 font-medium">{additive.functional_class}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-6 my-5">
          {/* Plain Language Summary */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Plain-Language Explanation
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">{additive.description}</p>
          </div>

          {/* Biological Mechanism Card */}
          <div className={`p-4 rounded-xl border ${mechInfo.bg}`}>
            <div className="flex items-center space-x-2 mb-2">
              <MechIcon className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">{mechInfo.title}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Biological Mechanism Flag: <strong className="text-white">{additive.biological_mechanism}</strong>.
              {additive.biological_mechanism === 'IgE Allergy' &&
                ' Triggers true immune response involving IgE antibody release, mast cell activation, and potential histamine response.'}
              {additive.biological_mechanism === 'Non-IgE Sensitivity' &&
                ' Direct chemical irritation of cell receptors or enzymes without IgE antibodies. Can trigger acute respiratory or skin flare-ups in sensitive hosts.'}
              {additive.biological_mechanism === 'Gut Microbiota impact' &&
                ' Long-term ingestion may alter intestinal microflora homeostasis or disrupt metabolic digestive enzymes over time.'}
              {additive.biological_mechanism === 'None' &&
                ' No elevated biological sensitivity risk recorded at standard regulatory intake limits.'}
            </p>
          </div>

          {/* Regulatory Context (FSSAI, FDA, EFSA) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Regulatory Approval & Permitted Limits
            </h4>
            <div className="text-sm text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800/80">
              {additive.regulatory_status}
            </div>
          </div>

          {/* Toxicological Standards Grid (NOAEL & ADI) */}
          {(additive.noael_mg_kg || additive.adi_mg_kg) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  NOAEL (No Observed Adverse Effect Level)
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400 mt-1 block">
                  {additive.noael_mg_kg ? `${additive.noael_mg_kg} mg/kg bw/day` : 'N/A'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Highest dose in toxicological animal trials with zero observed harmful effects.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ADI (Acceptable Daily Intake)
                </span>
                <span className="text-lg font-mono font-bold text-cyan-400 mt-1 block">
                  {additive.adi_mg_kg ? `${additive.adi_mg_kg} mg/kg bw/day` : 'N/A'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Calculated with standard 100-fold safety margin: ADI = NOAEL / 100.
                </p>
              </div>
            </div>
          )}

          {/* Common Foods found in */}
          {additive.common_foods && additive.common_foods.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Commonly Found In
              </h4>
              <div className="flex flex-wrap gap-2">
                {additive.common_foods.map((food, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {food}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
