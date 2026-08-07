import React from 'react';
import { History, Trash2, BookmarkPlus, ArrowRight, CheckCircle2, ShieldAlert, Barcode } from 'lucide-react';
import { NutriScanResult, AdditiveItem } from '../types';

interface HistoryTabProps {
  savedScans: NutriScanResult[];
  onLoadScan: (scan: NutriScanResult) => void;
  onDeleteScan: (id: string) => void;
  onClearAllScans: () => void;
  onSelectAdditive: (additive: AdditiveItem) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  savedScans,
  onLoadScan,
  onDeleteScan,
  onClearAllScans,
  onSelectAdditive,
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center">
            <History className="w-7 h-7 mr-3 text-emerald-400" />
            Saved Analysis History ({savedScans.length})
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Review your previously evaluated food ingredient lists, barcode GTIN scans, and additive safety reports.
          </p>
        </div>

        {savedScans.length > 0 && (
          <button
            onClick={onClearAllScans}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Grid */}
      {savedScans.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <BookmarkPlus className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No Saved Scans Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you run ingredient analyses or barcode scans, click "Save Scan" on the results page to store them locally in your history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedScans.map((scan) => {
            const scanId = scan.id || scan.timestamp || Math.random().toString();
            const productName = scan.scan_data?.detected_product_name || scan.product_name || 'Unknown Product';
            const additives = scan.additives_detected || [];
            const hasHighConcern = additives.some((a) => a.safety_rating === 'High Concern');

            return (
              <div
                key={scanId}
                className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 shadow-xl transition-all space-y-4 group relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-1">
                      {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Saved Scan'}
                    </span>
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                      {productName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {additives.length} Additive{additives.length !== 1 ? 's' : ''}
                      </span>
                      {hasHighConcern && (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center">
                          <ShieldAlert className="w-3 h-3 mr-1" /> High Concern
                        </span>
                      )}
                      {scan.scan_data?.barcode_number && (
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center">
                          <Barcode className="w-3 h-3 mr-1" /> GTIN: {scan.scan_data.barcode_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScan(scanId);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {scan.overall_analysis?.health_summary}
                </p>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onLoadScan(scan)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors"
                  >
                    <span>View Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
