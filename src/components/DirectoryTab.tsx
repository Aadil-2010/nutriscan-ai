import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, BookOpen } from 'lucide-react';
import { ADDITIVE_DIRECTORY } from '../data/additiveDirectory';
import { AdditiveItem } from '../types';

interface DirectoryTabProps {
  onSelectAdditive: (additive: AdditiveItem) => void;
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({ onSelectAdditive }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');

  const functionalClasses = [
    'All',
    'Preservative / Antimicrobial Agent',
    'Antioxidant',
    'Emulsifier & Stabilizer',
    'Synthetic Dye',
    'Flavor Enhancer',
    'Artificial Sweetener',
  ];

  const safetyRatings = ['All', 'Safe', 'Caution', 'High Concern'];

  const filteredDirectory = ADDITIVE_DIRECTORY.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ins_e_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'All' || item.functional_class === selectedClass;
    const matchesRating = selectedRating === 'All' || item.safety_rating === selectedRating;

    return matchesSearch && matchesClass && matchesRating;
  });

  const getSafetyBadge = (rating: string) => {
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center">
          <BookOpen className="w-7 h-7 mr-3 text-emerald-400" />
          E-Number & INS Additive Knowledge Directory
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">
          Search standard food additives recognized under the International Numbering System (INS / E-Numbers). Explore their functional classes, toxicological ADI ratings, and biological mechanism flags.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by additive name or E-Number (e.g. E211, Tartrazine)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all min-h-[44px]"
            />
          </div>

          {/* Class Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all min-h-[44px]"
            >
              {functionalClasses.map((cls, idx) => (
                <option key={idx} value={cls}>
                  {cls === 'All' ? 'All Functional Classes' : cls}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all min-h-[44px]"
            >
              {safetyRatings.map((rating, idx) => (
                <option key={idx} value={rating}>
                  {rating === 'All' ? 'All Safety Ratings' : rating}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Additive Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDirectory.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectAdditive(item)}
            className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                    {item.ins_e_number}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getSafetyBadge(item.safety_rating)}`}>
                    {item.safety_rating}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white mt-1.5 group-hover:text-emerald-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400">{item.functional_class}</p>
              </div>

              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{item.description}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
              <span>ADI: {item.adi_mg_kg ? `${item.adi_mg_kg} mg/kg` : 'N/A'}</span>
              <span>NOAEL: {item.noael_mg_kg ? `${item.noael_mg_kg} mg/kg` : 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredDirectory.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No additives match your current search and filter criteria.
        </div>
      )}
    </div>
  );
};
