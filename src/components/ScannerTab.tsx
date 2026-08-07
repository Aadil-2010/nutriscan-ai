import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RotateCcw, 
  SlidersHorizontal, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ArrowRight,
  Barcode,
  Database,
  Search
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { UserPreferences, PresetSample } from '../types';

interface ScannerTabProps {
  ingredientInput: string;
  setIngredientInput: (val: string) => void;
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  selectedImage: string | null;
  setSelectedImage: (val: string | null) => void;
  userPreferences: UserPreferences;
  openCamera: () => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onSelectSample: (sample: PresetSample) => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  ingredientInput,
  setIngredientInput,
  barcodeInput,
  setBarcodeInput,
  selectedImage,
  setSelectedImage,
  userPreferences,
  openCamera,
  onAnalyze,
  isLoading,
  onSelectSample,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setIngredientInput('');
    setBarcodeInput('');
    setSelectedImage(null);
  };

  const activePrefCount = Object.values(userPreferences).filter(Boolean).length;

  // Popular sample barcodes for quick testing with OpenFoodFacts
  const SAMPLE_BARCODES = [
    { label: 'Coca-Cola (5449000000996)', code: '5449000000996' },
    { label: 'Thai Rice Noodles (0737628064502)', code: '0737628064502' },
    { label: 'Nutella Hazelnut (3017620422003)', code: '3017620422003' },
    { label: 'Snickers Bar (5000159407236)', code: '5000159407236' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
            Analyze Food Ingredients & Additive Safety
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-1.5 sm:mt-2 leading-relaxed">
            Provide an ingredient label list or package photo. NutriScan AI extracts E-Numbers/INS codes, maps functional classes, detects IgE/non-IgE sensitivities, and evaluates ADI safety.
          </p>
        </div>
      </div>

      {/* Preset Sample Quick Loader (Horizontal scroll on mobile) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1 text-emerald-400 flex-shrink-0" />
            Quick Test Examples
          </span>
          <span className="text-[11px] text-slate-500">Tap to load sample</span>
        </div>
        
        {/* Scrollable on mobile, grid on desktop */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none sm:grid sm:grid-cols-3 md:grid-cols-6 sm:pb-0">
          {SAMPLE_PRODUCTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/40 text-left transition-all group flex-shrink-0 w-36 sm:w-auto"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                {sample.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sample.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Scanner Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Text Input, Barcode Lookup, & Image Upload */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* Barcode Search Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="barcode-input" className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center">
                <Barcode className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                Scan or Enter Barcode (GTIN / EAN / UPC)
              </label>
              <span className="inline-flex items-center text-[10px] sm:text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Database className="w-3 h-3 mr-1 text-emerald-400 flex-shrink-0" />
                OpenFoodFacts Engine
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  id="barcode-input"
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="e.g. 5449000000996, 0737628064502, 3017620422003..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-mono"
                />
                {barcodeInput && (
                  <button
                    onClick={() => setBarcodeInput('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Barcode pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 mr-1">Quick Barcodes:</span>
              {SAMPLE_BARCODES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setBarcodeInput(item.code)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-all font-mono"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredient Text Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="ingredient-textarea" className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                Paste or Type Ingredients List
              </label>
              {(ingredientInput || selectedImage || barcodeInput) && (
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center transition-colors min-h-[32px] px-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Clear All
                </button>
              )}
            </div>

            <textarea
              id="ingredient-textarea"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              placeholder="e.g. Carbonated Water, Sugar, Citric Acid (INS 330), Sodium Benzoate (INS 211), Tartrazine (INS 102), Ascorbic Acid..."
              className="w-full h-28 sm:h-32 bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 rounded-xl p-3 text-base sm:text-sm text-slate-100 placeholder-slate-500 resize-none outline-none transition-all"
            />
          </div>

          {/* Camera & File Upload Dropzone */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
              Or Attach Package Label Image
            </span>

            {selectedImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-64 flex items-center justify-center">
                <img src={selectedImage} alt="Uploaded food label" className="max-h-52 object-contain rounded-lg" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 shadow-md"
                >
                  Clear Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Camera Trigger */}
                <button
                  onClick={openCamera}
                  className="flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-6 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all group min-h-[52px]"
                >
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mr-3 sm:mr-0 sm:mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className="text-left sm:text-center">
                    <span className="text-xs sm:text-sm font-bold block">Use Device Camera</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block sm:mt-0.5">Snapshot label directly</span>
                  </div>
                </button>

                {/* File upload */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-6 rounded-xl bg-slate-950 border ${
                    dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-emerald-500/50'
                  } text-slate-300 transition-all cursor-pointer relative group min-h-[52px]`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mr-3 sm:mr-0 sm:mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className="text-left sm:text-center">
                    <span className="text-xs sm:text-sm font-bold block">Upload Label Image</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block sm:mt-0.5">JPG, PNG, WEBP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button for Mobile View */}
          <div className="block lg:hidden">
            <button
              disabled={isLoading || (!ingredientInput.trim() && !selectedImage && !barcodeInput.trim())}
              onClick={onAnalyze}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 group min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Additives...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Run NutriScan AI Analysis</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Health Sensitivity Flags & Desktop Submit Action */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          {/* Active Sensitivity Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-emerald-400 flex-shrink-0" />
                Active Sensitivity Flags
              </span>
              <span className="text-xs text-emerald-400 font-semibold">{activePrefCount} Active</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="truncate mr-2">Asthma / Sulfites Warning</span>
                <span className={userPreferences.asthmaSulfiteAlert ? 'text-emerald-400 font-bold flex-shrink-0' : 'text-slate-500 flex-shrink-0'}>
                  {userPreferences.asthmaSulfiteAlert ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="truncate mr-2">Gut Microbiota Focus</span>
                <span className={userPreferences.gutHealthFocus ? 'text-emerald-400 font-bold flex-shrink-0' : 'text-slate-500 flex-shrink-0'}>
                  {userPreferences.gutHealthFocus ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="truncate mr-2">Children Hyperactivity Watch</span>
                <span className={userPreferences.kidsSafetyFocus ? 'text-emerald-400 font-bold flex-shrink-0' : 'text-slate-500 flex-shrink-0'}>
                  {userPreferences.kidsSafetyFocus ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="truncate mr-2">FSSAI / India Limits</span>
                <span className={userPreferences.fssaiIndiaFocus ? 'text-emerald-400 font-bold flex-shrink-0' : 'text-slate-500 flex-shrink-0'}>
                  {userPreferences.fssaiIndiaFocus ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Trigger Button for Desktop View */}
          <div className="hidden lg:block">
            <button
              disabled={isLoading || (!ingredientInput.trim() && !selectedImage && !barcodeInput.trim())}
              onClick={onAnalyze}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 group"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Additives...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Run NutriScan AI Analysis</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Reassuring AI status loader message */}
          {isLoading && (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 text-center space-y-1.5 animate-pulse">
              <p className="text-xs font-semibold text-emerald-400">
                Extracting INS/E-Numbers & Cross-Referencing Knowledge Base...
              </p>
              <p className="text-[11px] text-slate-400">
                Checking IgE allergies, non-IgE sensitivities, gut microbiota mechanisms, and FSSAI/FDA/EFSA limits.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
