import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScannerTab } from './components/ScannerTab';
import { AnalysisResults } from './components/AnalysisResults';
import { DirectoryTab } from './components/DirectoryTab';
import { CalculatorTab } from './components/CalculatorTab';
import { GuideTab } from './components/GuideTab';
import { HistoryTab } from './components/HistoryTab';
import { HealthProfileTab } from './components/HealthProfileTab';
import { AuthScreen } from './components/AuthScreen';
import { CameraModal } from './components/CameraModal';
import { AdditiveDetailModal } from './components/AdditiveDetailModal';
import { PreferencesModal } from './components/PreferencesModal';
import { HealthChatbot } from './components/HealthChatbot';
import { generateContentWithKeyFallback, safeExtractJson } from './services/gemini';
import { 
  NutriScanResult, 
  AdditiveItem, 
  UserPreferences, 
  PresetSample,
  UserProfile 
} from './types';

const STORAGE_KEY_HISTORY = 'nutriscan_ai_saved_scans_v1';
const STORAGE_KEY_PREFS = 'nutriscan_ai_user_prefs_v1';
const STORAGE_KEY_USER = 'nutriscan_ai_user_profile_v1';
const STORAGE_KEY_THEME = 'nutriscan_ai_theme_v1';
const STORAGE_KEY_CACHE = 'nutriscan_ai_barcode_cache_v1';

// Direct Fast Lookup for Standard Indian FMCG Barcodes
const LOCAL_INDIAN_BARCODES: Record<string, { name: string; brand: string; ingredients: string; isNonFood?: boolean }> = {
  '8901030986017': {
    name: 'Horlicks Classic Malt Health Drink',
    brand: 'Hindustan Unilever Limited (HUL)',
    ingredients: 'Malted Barley, Wheat Flour, Milk Solids, Sugar, Minerals, Salt, Acidity Regulators (INS 501(ii), INS 500(ii)), Vitamins, Natural Colour.'
  },
  '8901972058629': {
    name: 'Dukes Waffy Chocolate Flavoured Wafers',
    brand: 'Dukes (Ravi Foods)',
    ingredients: 'Refined Wheat Flour (Maida), Sugar, Hydrogenated Vegetable Oil, Cocoa Solids, Emulsifier (INS 322), Leavening Agents (INS 500(ii), INS 503(ii)), Salt.'
  },
  '8901491101837': {
    name: 'Kurkure Masala Munch',
    brand: 'PepsiCo India',
    ingredients: 'Rice Meal, Edible Vegetable Oil (Palmolein Oil), Corn Meal, Gram Meal, Spices and Condiments, Salt, Acidity Regulator (INS 330), Flavour Enhancers (INS 627, INS 631).'
  },
  '8901063012486': {
    name: 'Britannia Bourbon The Original Chocolate Biscuits',
    brand: 'Britannia Industries',
    ingredients: 'Refined Wheat Flour, Sugar, Palm Oil, Cocoa Solids, Invert Sugar Syrup, Raising Agents (INS 500(ii), INS 503(ii)), Emulsifier (INS 322).'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'health-profile' | 'directory' | 'calculator' | 'guide' | 'history'>('scanner');
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      console.error('Error loading theme:', e);
    }
    return 'dark';
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading user profile from localStorage:', e);
    }
    return null;
  });

  // Scanner Form State
  const [productNameInput, setProductNameInput] = useState<string>('');
  const [ingredientInput, setIngredientInput] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis Result State
  const [analysisResult, setAnalysisResult] = useState<NutriScanResult | null>(null);

  // Modals & Panels State
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'label' | 'barcode'>('barcode');
  const [selectedAdditiveModal, setSelectedAdditiveModal] = useState<AdditiveItem | null>(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState<boolean>(false);
  const [showEthicalBoard, setShowEthicalBoard] = useState<boolean>(false);

  // User Health Preferences State
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading preferences from localStorage:', e);
    }
    return {
      asthmaSulfiteAlert: false,
      gutHealthFocus: false,
      kidsSafetyFocus: false,
      fssaiIndiaFocus: false,
      igeAllergyProne: false,
      customSensitivities: [],
    };
  });

  // Saved Scan History State
  const [savedScans, setSavedScans] = useState<NutriScanResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading history from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [activeTab, analysisResult]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error('Error saving user profile to localStorage:', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(userPreferences));
    } catch (e) {
      console.error('Error saving preferences to localStorage:', e);
    }
  }, [userPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(savedScans));
    } catch (e) {
      console.error('Error saving history to localStorage:', e);
    }
  }, [savedScans]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const handleOpenCamera = (mode: 'label' | 'barcode') => {
    setCameraMode(mode);
    setIsCameraOpen(true);
  };

  const handleAnalyze = async () => {
    if (!productNameInput.trim() && !ingredientInput.trim() && !selectedImage && !barcodeInput.trim()) {
      setErrorMsg('Please enter a product name, barcode number, ingredient text, or upload a label image.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const trimmedBarcode = barcodeInput.trim();
      const trimmedProductName = productNameInput.trim();
      const cacheKey = trimmedBarcode
        ? `barcode_${trimmedBarcode}`
        : trimmedProductName
        ? `product_${trimmedProductName.toLowerCase()}`
        : '';

      // Check Local Cache
      if (cacheKey && !selectedImage) {
        try {
          const cachedMap = JSON.parse(localStorage.getItem(STORAGE_KEY_CACHE) || '{}');
          if (cachedMap[cacheKey]) {
            setAnalysisResult({
              ...cachedMap[cacheKey],
              id: `scan-${Date.now()}`,
              timestamp: new Date().toISOString()
            });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Cache read bypass:', e);
        }
      }

      // Step 1: Resolve Barcode via Local FMCG Map -> OpenFoodFacts -> OpenBeautyFacts
      let fetchedIngredients = ingredientInput.trim();
      let fetchedProductName = trimmedProductName;
      let fetchedBrand = '';
      let offImageUrl = '';
      let offMatched = false;

      if (trimmedBarcode) {
        if (LOCAL_INDIAN_BARCODES[trimmedBarcode]) {
          const localItem = LOCAL_INDIAN_BARCODES[trimmedBarcode];
          fetchedProductName = localItem.name;
          fetchedBrand = localItem.brand;
          fetchedIngredients = localItem.ingredients;
          offMatched = true;
        } else {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            let offRes = await fetch(
              `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmedBarcode)}.json`,
              { signal: controller.signal }
            );
            let offData = offRes.ok ? await offRes.json() : null;

            if (!offData || offData.status !== 1 || !offData.product) {
              const beautyRes = await fetch(
                `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(trimmedBarcode)}.json`,
                { signal: controller.signal }
              );
              if (beautyRes.ok) {
                const beautyData = await beautyRes.json();
                if (beautyData.status === 1 && beautyData.product) {
                  offData = beautyData;
                }
              }
            }

            clearTimeout(timeoutId);

            if (offData && offData.status === 1 && offData.product) {
              offMatched = true;
              const p = offData.product;
              fetchedProductName = p.product_name || p.product_name_en || p.generic_name || fetchedProductName;
              fetchedBrand = p.brands || (Array.isArray(p.brands_tags) ? p.brands_tags.join(', ') : '') || '';
              fetchedIngredients = p.ingredients_text || p.ingredients_text_en || fetchedIngredients;
              offImageUrl = p.image_url || p.image_front_url || p.image_small_url || '';
            }
          } catch (offErr) {
            console.warn('Database lookups bypassed or timed out.');
          }
        }
      }

      // Step 2: Gemini Prompting
      const activeReportsContext = userProfile?.medicalReports
        ? userProfile.medicalReports.map((r, i) => `Report ${i + 1} (${r.title}): ${r.reportText}`).join('; ')
        : 'None recorded';

      const userSensitivitiesContext = Array.isArray(userProfile?.symptoms)
        ? userProfile.symptoms.join(', ')
        : (userProfile?.symptoms || 'None specified');

      const systemPrompt = `
You are FoodWise AI, an expert food safety toxicologist, regulatory specialist (FSSAI, US FDA, EFSA), and clinical dietitian.

Analyze the scanned food product:
- Barcode Number: ${trimmedBarcode || 'N/A'}
- Scanned Product Name: "${fetchedProductName || 'Identify accurately from barcode/database'}"
- Scanned Brand: "${fetchedBrand || 'Identify accurately from barcode/database'}"
- Scanned Ingredients: "${fetchedIngredients || 'Reconstruct real commercial ingredient formulation based on barcode and product'}"
- Patient Symptoms & Allergies: ${userSensitivitiesContext}
- Patient Medical Reports: ${activeReportsContext}
- Dietary Preferences: ${JSON.stringify(userPreferences)}

CRITICAL INSTRUCTIONS:
1. Identify the EXACT real-world product (e.g. "Horlicks Classic Malt Health Drink", "Dukes Waffy Chocolate Flavored Wafers", "Kurkure Masala Munch", etc.). NEVER return placeholder words like "Product" or "Identified Manufacturer".
2. If non-food (personal care/cosmetic), state this clearly in the summary and evaluate cosmetic ingredients.
3. Extract ALL relevant food additives with their INS / E numbers (e.g., INS 322, INS 150d, INS 500ii, INS 503ii, INS 330, INS 621, etc.). Include at least 3-6 individual detected additives typical of this product category.
4. For EVERY additive detected, provide its functional class, safety rating, biological mechanism, and health note.
5. Output STRICT JSON matching this schema:
{
  "scan_data": {
    "detected_product_name": "Accurate Real Product Name",
    "brand_name": "Accurate Real Brand Name",
    "barcode_detected": ${Boolean(trimmedBarcode)},
    "barcode_number": "${trimmedBarcode}",
    "openfoodfacts_matched": ${offMatched}
  },
  "product_info": {
    "total_additives_found": 4
  },
  "overall_analysis": {
    "health_summary": "Comprehensive 3-sentence clinical and nutritional evaluation of the product ingredients.",
    "key_warnings": [
      "High refined sugar or malt content",
      "Contains potential allergen triggers (Gluten, Milk solids)"
    ],
    "toxicological_note": "Evaluated against FSSAI and EFSA Acceptable Daily Intake (ADI) benchmarks."
  },
  "additives_detected": [
    {
      "ins_e_number": "INS 500(ii)",
      "name": "Sodium Bicarbonate",
      "functional_class": "Acidity Regulator / Raising Agent",
      "safety_rating": "Safe",
      "biological_mechanism": "Buffers pH and releases carbon dioxide.",
      "description": "Common mineral salt used to balance acidity in beverage formulations.",
      "regulatory_status": "Approved by FSSAI, US FDA (GRAS), EFSA"
    },
    {
      "ins_e_number": "INS 501(ii)",
      "name": "Potassium Bicarbonate",
      "functional_class": "Acidity Regulator",
      "safety_rating": "Safe",
      "biological_mechanism": "Maintains optimal pH stability and electrolyte balance.",
      "description": "Permitted mineral stabilizer.",
      "regulatory_status": "Approved by FSSAI, FDA, EFSA"
    }
  ],
  "allergen_alert": {
    "detected": false,
    "allergen_name": "Barley / Gluten / Milk",
    "warning_type": "Ingredient Watch",
    "message": "Contains malted barley, wheat flour, and milk solids. Not suitable for individuals with celiac disease or severe lactose intolerance."
  }
}
`;

      const parts: any[] = [];
      if (selectedImage) {
        const cleanBase64 = selectedImage.includes(',') ? selectedImage.split(',')[1] : selectedImage;
        const mimeType = selectedImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        });
      }

      const textPayload = `
Barcode: ${trimmedBarcode || 'N/A'}
Product: ${fetchedProductName || productNameInput || 'Determine from barcode'}
Brand: ${fetchedBrand || 'Determine from barcode'}
Ingredients: ${fetchedIngredients || 'Reconstruct ingredients from known formulation'}
`;
      parts.push({ text: textPayload });

      // Step 3: Run AI and Extract JSON Safely
      const rawText = await generateContentWithKeyFallback(systemPrompt, parts);
      const parsedData = safeExtractJson(rawText);

      const finalProductName = parsedData.scan_data?.detected_product_name || fetchedProductName || productNameInput || 'Scanned Food Product';
      const finalBrandName = parsedData.scan_data?.brand_name || fetchedBrand || '';

      const completeResult: NutriScanResult = {
        ...parsedData,
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        off_image_url: offImageUrl || undefined,
        product_name: finalProductName,
        scan_data: {
          detected_product_name: finalProductName,
          brand_name: finalBrandName,
          barcode_detected: Boolean(trimmedBarcode || parsedData.scan_data?.barcode_detected),
          barcode_number: trimmedBarcode || parsedData.scan_data?.barcode_number || '',
          openfoodfacts_matched: Boolean(offMatched || parsedData.scan_data?.openfoodfacts_matched),
        },
        product_info: {
          total_additives_found: Array.isArray(parsedData.additives_detected)
            ? parsedData.additives_detected.length
            : (parsedData.product_info?.total_additives_found ?? 0),
        },
        overall_analysis: {
          health_summary: parsedData.overall_analysis?.health_summary || 'Analysis complete based on listed ingredients and current profile.',
          key_warnings: Array.isArray(parsedData.overall_analysis?.key_warnings) ? parsedData.overall_analysis.key_warnings : [],
          toxicological_note: parsedData.overall_analysis?.toxicological_note || 'Consume in moderation according to dietary guidance.',
        },
        additives_detected: Array.isArray(parsedData.additives_detected) ? parsedData.additives_detected : [],
        raw_ingredients_text: fetchedIngredients || ingredientInput || productNameInput || trimmedBarcode || 'Image Scan',
        image_preview: selectedImage || undefined,
        allergen_alert: parsedData.allergen_alert || {
          detected: false,
          allergen_name: '',
          warning_type: '',
          message: ''
        },
      };

      // Save to local cache
      if (cacheKey && !selectedImage) {
        try {
          const cachedMap = JSON.parse(localStorage.getItem(STORAGE_KEY_CACHE) || '{}');
          cachedMap[cacheKey] = completeResult;
          localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(cachedMap));
        } catch (e) {
          console.warn('Cache write bypass:', e);
        }
      }

      setAnalysisResult(completeResult);
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('⏳ All AI quota limits reached for today. Add a fallback key in Vercel to continue.');
      } else {
        setErrorMsg(err.message || 'Failed to complete FoodWise AI analysis. Please check your connection or try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sample: PresetSample) => {
    setIngredientInput(sample.ingredientsText);
    setBarcodeInput(sample.barcodeNumber || '');
    setSelectedImage(sample.sampleImage || null);
    setAnalysisResult(null);
    setErrorMsg(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleResetScan = () => {
    setAnalysisResult(null);
    setProductNameInput('');
    setIngredientInput('');
    setBarcodeInput('');
    setSelectedImage(null);
    setErrorMsg(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSaveScan = (result: NutriScanResult) => {
    setSavedScans((prev) => {
      const exists = prev.some((item) => item.id === result.id);
      if (exists) return prev;
      return [result, ...prev];
    });
  };

  const handleDeleteScan = (id: string) => {
    setSavedScans((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllScans = () => {
    if (window.confirm('Are you sure you want to clear your saved scan history?')) {
      setSavedScans([]);
    }
  };

  const handleLoadSavedScan = (scan: NutriScanResult) => {
    setAnalysisResult(scan);
    setActiveTab('scanner');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const isCurrentScanSaved = Boolean(
    analysisResult && savedScans.some((s) => s.id === analysisResult.id)
  );

  const activePreferenceCount = (
    Object.entries(userPreferences).filter(([key, val]) => {
      if (key === 'customSensitivities') return Array.isArray(val) && val.length > 0;
      return Boolean(val);
    }).length
  );

  if (!userProfile || !userProfile.isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 selection:bg-emerald-500/30 selection:text-emerald-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedScans.length}
        openPreferencesModal={() => setIsPrefsOpen(true)}
        activePreferenceCount={activePreferenceCount}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Control Banner with Theme Toggle */}
      <div className={`border-b py-2.5 px-4 text-xs transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
              Scientific Framework
            </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}>
              Personalised Food Suitability & Allergen Screening Standard
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              <span>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowEthicalBoard(!showEthicalBoard)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg shadow-sm transition-all hover:border-emerald-500/60 active:scale-95 cursor-pointer flex-shrink-0"
            >
              <span>📋</span>
              <span>{showEthicalBoard ? 'Hide Framework Rules' : 'View Safety Framework'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ethical Framework Panel */}
      {showEthicalBoard && (
        <div className={`border-b p-5 text-sm ${
          isDark ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-100 border-emerald-500/40'
        }`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`border rounded-xl p-4 ${
              isDark ? 'bg-rose-950/30 border-rose-500/30 text-slate-300' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <h4 className="font-bold text-rose-500 text-base mb-2 flex items-center gap-2">
                ❌ FOODWISE DOES NOT:
              </h4>
              <ul className="space-y-1.5 text-xs list-disc pl-5">
                <li>Diagnose medical conditions or food allergies.</li>
                <li>Replace a licensed doctor, nutritionist, or dietitian.</li>
                <li>Guarantee that a food product is 100% safe for all individuals.</li>
                <li>Declare ingredients "toxic" without toxicological evidence (NOAEL/ADI).</li>
              </ul>
            </div>
            <div className={`border rounded-xl p-4 ${
              isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-300' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <h4 className="font-bold text-emerald-600 text-base mb-2 flex items-center gap-2">
                ✅ FOODWISE DOES:
              </h4>
              <ul className="space-y-1.5 text-xs list-disc pl-5">
                <li>Calculate a Personalised Food Suitability Score based on context.</li>
                <li>Highlight potential allergens and "may contain traces of" cross-contamination.</li>
                <li>Explain nutritional information and food label codes objectively.</li>
                <li>Empower consumers with regulatory standards (FSSAI, FDA, EFSA).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="max-w-5xl mx-auto px-4 mt-4 w-full">
          <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-4 flex items-center justify-between text-rose-200 text-sm shadow-xl">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="ml-3 font-bold hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 md:pb-8">
        {analysisResult?.allergen_alert?.detected && (
          <div className="mb-6 bg-red-950/90 border-2 border-red-500 text-red-100 p-5 rounded-2xl shadow-2xl animate-pulse">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔴</span>
              <div>
                <h3 className="text-lg font-extrabold text-red-300 tracking-wide uppercase">
                  ALLERGEN ALERT: {analysisResult.allergen_alert.allergen_name || 'Known Allergen Detected'}
                </h3>
                <p className="mt-1 text-sm text-red-200 font-medium">
                  {analysisResult.allergen_alert.message || 'Ingredient or trace warning detected. Avoid this product and check physical packaging.'}
                </p>
                <div className="mt-2 text-xs bg-red-900/60 text-red-300 inline-block px-2.5 py-1 rounded-md border border-red-700/50">
                  Warning Type: {analysisResult.allergen_alert.warning_type || 'Direct Ingredient / Cross-Contamination Warning'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          analysisResult ? (
            <AnalysisResults
              result={analysisResult}
              onReset={handleResetScan}
              onSelectAdditive={(add) => setSelectedAdditiveModal(add)}
              onSaveScan={handleSaveScan}
              isSaved={isCurrentScanSaved}
            />
          ) : (
            <ScannerTab
              productNameInput={productNameInput}
              setProductNameInput={setProductNameInput}
              ingredientInput={ingredientInput}
              setIngredientInput={setIngredientInput}
              barcodeInput={barcodeInput}
              setBarcodeInput={setBarcodeInput}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              userPreferences={userPreferences}
              openCamera={handleOpenCamera}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              onSelectSample={handleSelectSample}
            />
          )
        )}

        {activeTab === 'health-profile' && (
          <HealthProfileTab
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
          />
        )}

        {activeTab === 'directory' && (
          <DirectoryTab
            onSelectAdditive={(add) => setSelectedAdditiveModal(add)}
          />
        )}

        {activeTab === 'calculator' && <CalculatorTab />}

        {activeTab === 'guide' && <GuideTab />}

        {activeTab === 'history' && (
          <HistoryTab
            savedScans={savedScans}
            onLoadScan={handleLoadSavedScan}
            onDeleteScan={handleDeleteScan}
            onClearAllScans={handleClearAllScans}
            onSelectAdditive={(add) => setSelectedAdditiveModal(add)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        isDark ? 'border-slate-800/80 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>FoodWise / NutriScan AI</span>
            <span>•</span>
            <span>Scientific Food Additive & Suitability Engine</span>
          </div>
          <div>
            FSSAI (India) • FDA (USA) • EFSA (EU) Reference Standards
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <HealthChatbot />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        mode={cameraMode}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedData, mode) => {
          if (mode === 'barcode') {
            setBarcodeInput(capturedData);
          } else {
            setSelectedImage(capturedData);
          }
          setIsCameraOpen(false);
        }}
      />

      {/* Additive Detail Modal */}
      <AdditiveDetailModal
        additive={selectedAdditiveModal}
        onClose={() => setSelectedAdditiveModal(null)}
      />

      {/* Health Preferences Modal */}
      <PreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
        preferences={userPreferences}
        setPreferences={setUserPreferences}
      />
    </div>
  );
}