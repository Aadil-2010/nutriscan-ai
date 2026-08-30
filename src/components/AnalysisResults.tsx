import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Download, 
  BookmarkPlus, 
  ExternalLink,
  RotateCcw,
  BookOpen,
  Barcode,
  Scale,
  Database
} from 'lucide-react';
import { NutriScanResult, AdditiveItem } from '../types';

interface AnalysisResultsProps {
  result: NutriScanResult;
  onReset: () => void;
  onSelectAdditive: (additive: AdditiveItem) => void;
  onSaveScan: (result: NutriScanResult) => void;
  isSaved: boolean;
  onOpenEthicalModal?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onReset,
  onSelectAdditive,
  onSaveScan,
  isSaved,
}) => {
  const { scan_data, product_info, product_name: legacyProductName, additives_detected = [], overall_analysis } = result;

  const productName = scan_data?.detected_product_name || legacyProductName || 'Unknown Product';
  const totalAdditives = product_info?.total_additives_found ?? additives_detected.length;

  const getSafetyBadge = (rating: string) => {
    switch (rating) {
      case 'Safe':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          label: 'Safe',
        };
      case 'Caution':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          label: 'Caution',
        };
      case 'High Concern':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: ShieldAlert,
          label: 'High Concern',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Info,
          label: rating || 'Evaluated',
        };
    }
  };

  const getOverallRiskLevel = () => {
    const hasHighConcern = additives_detected.some((a) => a.safety_rating === 'High Concern');
    const hasCaution = additives_detected.some((a) => a.safety_rating === 'Caution');
    if (hasHighConcern) return { title: 'High Additive Concern', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (hasCaution) return { title: 'Moderate Caution Recommended', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { title: 'Generally Safe Profile', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  };

  const riskStatus = getOverallRiskLevel();

  const handleDownloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_nutriscan_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      
      {/* Product & Executive Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${riskStatus.color}`}>
                {riskStatus.title}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 whitespace-nowrap">
                {totalAdditives} Additive{totalAdditives !== 1 ? 's' : ''} Identified
              </span>

              {scan_data?.barcode_detected && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
                  <Barcode className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  GTIN: {scan_data.barcode_number || 'Detected'}
                </span>
              )}

              {scan_data?.openfoodfacts_matched && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  <Database className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  OpenFoodFacts Verified
                </span>
              )}
            </div>

            <div className="flex items-start space-x-3 mt-1">
              {result.off_image_url && (
                <img
                  src={result.off_image_url}
                  alt={productName}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg border border-slate-800 bg-slate-950 p-1 flex-shrink-0"
                />
              )}
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-white">{productName}</h2>
                {scan_data?.brand_name && (
                  <p className="text-xs text-slate-400 font-medium">Brand: {scan_data.brand_name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSaveScan(result)}
              className={`flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[40px] flex-1 sm:flex-initial ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <BookmarkPlus className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isSaved ? 'Saved in History' : 'Save Scan'}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all min-h-[40px] flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Export JSON</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all min-h-[40px] min-w-[40px]"
              title="New Scan"
            >
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Critical Risk Warnings Banner (Protected with optional chaining) */}
        {overall_analysis?.key_warnings && overall_analysis.key_warnings.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Critical Health & Mechanism Alerts</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-rose-200/90 leading-relaxed pl-1">
              {overall_analysis.key_warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* High-level Health Summary */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Health Evaluation Summary
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed">
            {overall_analysis?.health_summary || 'Detailed summary generated for current profile.'}
          </p>
        </div>

        {/* Toxicological Note */}
        {overall_analysis?.toxicological_note && (
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex items-start space-x-2 text-xs text-slate-300">
            <Scale className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">Toxicological Guidance (ADI):</span>
              <span>{overall_analysis.toxicological_note}</span>
            </div>
          </div>
        )}
      </div>

      {/* Additive Breakdown Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-emerald-400" />
            Identified Food Additives ({additives_detected.length})
          </h3>
          <span className="text-xs text-slate-400">Click card for toxicology details & ADI</span>
        </div>

        {additives_detected.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-base">No Standard Additives Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This product list appears to consist predominantly of whole food ingredients or standard food bases without recognized E-Number/INS artificial additives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additives_detected.map((additive, idx) => {
              const badge = getSafetyBadge(additive.safety_rating);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={idx}
                  onClick={() => onSelectAdditive(additive)}
                  className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer space-y-4 group relative"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                          {additive.ins_e_number}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-white mt-1.5 group-hover:text-emerald-400 transition-colors">
                        {additive.name}
                      </h4>
                      <p className="text-xs text-slate-400">{additive.functional_class}</p>
                    </div>

                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>

                  {/* Biological Mechanism Tag */}
                  {additive.biological_mechanism && (
                    <div className="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Biological Mechanism</span>
                      <span className="text-slate-200 font-medium">{additive.biological_mechanism}</span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {additive.description}
                  </p>

                  {/* Regulatory Snippet */}
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 line-clamp-1">
                    <strong className="text-slate-300">Regulatory:</strong> {additive.regulatory_status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};