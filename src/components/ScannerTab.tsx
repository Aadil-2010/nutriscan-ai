import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RotateCcw, 
  SlidersHorizontal, 
  FileText, 
  ArrowRight,
  Barcode,
  Database,
  Tag
} from 'lucide-react';
import { UserPreferences, PresetSample } from '../types';

interface ScannerTabProps {
  productNameInput?: string;
  setProductNameInput?: (val: string) => void;
  ingredientInput: string;
  setIngredientInput: (val: string) => void;
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  selectedImage: string | null;
  setSelectedImage: (val: string | null) => void;
  userPreferences: UserPreferences & { customSensitivities?: string[] };
  openCamera: (mode: 'label' | 'barcode') => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onSelectSample?: (sample: PresetSample) => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  productNameInput: externalProductName = '',
  setProductNameInput: externalSetProductName,
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
}) => {
  // Local state fallback so typing ALWAYS updates state and unlocks the button
  const [localProductName, setLocalProductName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const activeProductName = externalSetProductName ? externalProductName : localProductName;

  const handleProductNameChange = (val: string) => {
    setLocalProductName(val);
    if (externalSetProductName) {
      externalSetProductName(val);
    }
  };

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
    handleProductNameChange('');
    setIngredientInput('');
    setBarcodeInput('');
    setSelectedImage(null);
  };

  const SAMPLE_BARCODES = [
    { label: 'Coca-Cola', code: '5449000000996', name: 'Coca-Cola Original Taste' },
    { label: 'Thai Rice Noodles', code: '0737628064502', name: 'Thai Kitchen Stir-Fry Rice Noodles' },
    { label: 'Nutella', code: '3017620422003', name: 'Nutella Hazelnut Spread' },
    { label: 'Snickers', code: '5000159407236', name: 'Snickers Milk Chocolate Bar' },
  ];

  const handleSelectQuickBarcode = (item: { label: string; code: string; name: string }) => {
    setBarcodeInput(item.code);
    handleProductNameChange(item.name);
  };

  const activePresetCount = Object.entries(userPreferences).filter(([key, val]) => {
    if (key === 'customSensitivities') return false;
    return Boolean(val);
  }).length;
  
  const customSensitivitiesCount = userPreferences.customSensitivities?.length || 0;
  const totalActiveFlagsCount = activePresetCount + customSensitivitiesCount;

  // Check if button should be disabled (unlocked if ANY field has value)
  const isInputEmpty = !activeProductName.trim() && !ingredientInput.trim() && !selectedImage && !barcodeInput.trim();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
            Analyze Food Ingredients & Additive Safety
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-1.5 sm:mt-2 leading-relaxed">
            Provide a product name, ingredient label list, or package photo. NutriScan AI extracts E-Numbers/INS codes, maps functional classes, detects IgE/non-IgE sensitivities, and evaluates ADI safety.
          </p>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">

          {/* Item Name Field */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-2">
            <label htmlFor="product-name-input" className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                Product / Item Name
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Direct search by name supported)</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              value={activeProductName}
              onChange={(e) => handleProductNameChange(e.target.value)}
              placeholder="e.g. Lays Classic Chips, Coca-Cola Original, Doritos Nacho Cheese..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Barcode Input */}
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
                  placeholder="e.g. 5449000000996, 0737628064502..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 rounded-xl pl-3.5 pr-20 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => setBarcodeInput('')}
                      className="text-xs text-slate-500 hover:text-slate-300 px-1"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openCamera('barcode')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-bold border border-cyan-500/40 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Barcodes */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 mr-1">Quick Barcodes:</span>
              {SAMPLE_BARCODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectQuickBarcode(item)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-all font-mono"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredient Text Field */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="ingredient-textarea" className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                Paste or Type Ingredients List
              </label>
              {(ingredientInput || selectedImage || barcodeInput || activeProductName) && (
                <button
                  type="button"
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
              placeholder="e.g. Potatoes, Vegetable Oil, Salt, Citric Acid (INS 330), Sodium Benzoate..."
              className="w-full h-28 sm:h-32 bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 rounded-xl p-3 text-base sm:text-sm text-slate-100 placeholder-slate-500 resize-none outline-none transition-all"
            />
          </div>

          {/* Camera Triggers & Dropzone */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
              Or Capture Image / Attach Package Label
            </span>

            {selectedImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-64 flex items-center justify-center">
                <img src={selectedImage} alt="Uploaded label" className="max-h-52 object-contain rounded-lg" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 shadow-md"
                >
                  Clear Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => openCamera('barcode')}
                  className="flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all group min-h-[52px]"
                >
                  <Barcode className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 mr-3 sm:mr-0 sm:mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className="text-left sm:text-center">
                    <span className="text-xs sm:text-sm font-bold block">Scan Barcode</span>
                    <span className="text-[10px] text-slate-400 block sm:mt-0.5">Use shutter camera</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openCamera('label')}
                  className="flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all group min-h-[52px]"
                >
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 mr-3 sm:mr-0 sm:mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className="text-left sm:text-center">
                    <span className="text-xs sm:text-sm font-bold block">Take Label Photo</span>
                    <span className="text-[10px] text-slate-400 block sm:mt-0.5">Snapshot ingredients</span>
                  </div>
                </button>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-5 rounded-xl bg-slate-950 border ${
                    dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-emerald-500/50'
                  } text-slate-300 transition-all cursor-pointer relative group min-h-[52px]`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400 mr-3 sm:mr-0 sm:mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className="text-left sm:text-center">
                    <span className="text-xs sm:text-sm font-bold block">Upload File</span>
                    <span className="text-[10px] text-slate-400 block sm:mt-0.5">JPG, PNG, WEBP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Action Button */}
          <div className="block lg:hidden">
            <button
              disabled={isLoading || isInputEmpty}
              onClick={onAnalyze}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 group min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Product & Additives...</span>
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

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-emerald-400 flex-shrink-0" />
                Active Sensitivity Flags
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {totalActiveFlagsCount} Active
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              {userPreferences.asthmaSulfiteAlert && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40">
                  <span className="truncate mr-2 font-medium">Asthma / Sulfites Warning</span>
                  <span className="font-bold text-emerald-400">ON</span>
                </div>
              )}

              {userPreferences.gutHealthFocus && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40">
                  <span className="truncate mr-2 font-medium">Gut Microbiota Focus</span>
                  <span className="font-bold text-emerald-400">ON</span>
                </div>
              )}

              {userPreferences.kidsSafetyFocus && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40">
                  <span className="truncate mr-2 font-medium">Children Hyperactivity Watch</span>
                  <span className="font-bold text-emerald-400">ON</span>
                </div>
              )}

              {userPreferences.fssaiIndiaFocus && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40">
                  <span className="truncate mr-2 font-medium">FSSAI / India Limits</span>
                  <span className="font-bold text-emerald-400">ON</span>
                </div>
              )}

              {userPreferences.customSensitivities && userPreferences.customSensitivities.length > 0 && (
                userPreferences.customSensitivities.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40">
                    <span className="truncate mr-2 font-medium">{item}</span>
                    <span className="font-bold text-emerald-400">CUSTOM</span>
                  </div>
                ))
              )}

              {totalActiveFlagsCount === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500">
                  No active health sensitivities selected. Click <span className="text-emerald-400 font-semibold">Filters</span> in navigation to add active flags.
                </div>
              )}
            </div>
          </div>

          {/* Desktop Submit Button */}
          <div className="hidden lg:block">
            <button
              disabled={isLoading || isInputEmpty}
              onClick={onAnalyze}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 group"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Product & Additives...</span>
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

          {/* Loading status box */}
          {isLoading && (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 text-center space-y-1.5 animate-pulse">
              <p className="text-xs font-semibold text-emerald-400">
                Searching OpenFoodFacts & Knowledge Base for "{activeProductName || 'Product'}"...
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