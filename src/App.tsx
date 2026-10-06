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
import { 
  generateContentWithKeyFallback, 
  safeExtractJson,
  crossVerifyBarcodeWithWeb,
  detectAllPackagesInFrame
} from './services/gemini';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'health-profile' | 'directory' | 'calculator' | 'guide' | 'history'>('scanner');
  
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

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading user profile:', e);
    }
    return null;
  });

  const [productNameInput, setProductNameInput] = useState<string>('');
  const [ingredientInput, setIngredientInput] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<NutriScanResult | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'label' | 'barcode'>('barcode');
  const [selectedAdditiveModal, setSelectedAdditiveModal] = useState<AdditiveItem | null>(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState<boolean>(false);
  const [showEthicalBoard, setShowEthicalBoard] = useState<boolean>(false);

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading preferences:', e);
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

  const [savedScans, setSavedScans] = useState<NutriScanResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading history:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.removeItem('nutriscan_ai_barcode_cache_v1');
    } catch (e) {
      console.warn('Cache purge bypassed:', e);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
      console.error('Error saving profile:', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(userPreferences));
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
  }, [userPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(savedScans));
    } catch (e) {
      console.error('Error saving history:', e);
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
      setErrorMsg('Please enter a product name, barcode number, ingredient text, or scan an image.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const trimmedBarcode = barcodeInput.trim();
      const userEnteredName = trimmedBarcode ? '' : productNameInput.trim();
      const userEnteredIngredients = ingredientInput.trim();

      const userAge = userProfile?.age ? `${userProfile.age} years old` : (userPreferences.kidsSafetyFocus ? 'Child (<12 years)' : 'Adult');
      const userWeight = userProfile?.weightKg ? `${userProfile.weightKg} kg` : (userPreferences.kidsSafetyFocus ? '25 kg (Child)' : '65 kg (Adult)');

      const activeReportsContext = userProfile?.medicalReports
        ? userProfile.medicalReports.map((r, i) => `Report ${i + 1} (${r.title}): ${r.reportText}`).join('; ')
        : 'None recorded';

      const userSensitivitiesContext = Array.isArray(userProfile?.symptoms)
        ? userProfile.symptoms.join(', ')
        : (userProfile?.symptoms || 'None specified');

      // MODE 1: MULTI-PACKAGE VISUAL RECOGNITION (Image Scan)
      if (selectedImage) {
        try {
          const multiResult = await detectAllPackagesInFrame(
            selectedImage,
            userAge,
            userWeight,
            userSensitivitiesContext
          );

          if (multiResult?.packages && multiResult.packages.length > 0) {
            const primary = multiResult.packages[0];
            const otherPackagesSummary = multiResult.packages.length > 1
              ? `Detected ${multiResult.total_packages_detected} packages in image: ${multiResult.packages.map(p => `${p.brand_name}${p.product_name}`).join(', ')}`
              : 'Single package identified.';

            const completeMultiResult: NutriScanResult = {
              id: `scan-${Date.now()}`,
              timestamp: new Date().toISOString(),
              product_name: `${primary.brand_name} ${primary.product_name} (${primary.variant_or_flavor})`.trim(),
              scan_data: {
                detected_product_name: primary.product_name,
                brand_name: primary.brand_name,
                barcode_detected: false,
                barcode_number: '',
                openfoodfacts_matched: false,
              },
              product_info: {
                total_additives_found: primary.detected_additives.length,
                target_serving_size: 'Standard portion',
                age_group_evaluated: userAge,
              },
              overall_analysis: {
                health_summary: primary.health_summary,
                key_warnings: [otherPackagesSummary],
                toxicological_note: `Calculated for user body mass of ${userWeight}.`,
              },
              additives_detected: primary.detected_additives.map((a) => ({
                ins_e_number: a.ins_e_number,
                name: a.name,
                functional_class: a.functional_class,
                safety_rating: a.safety_rating,
                biological_mechanism: 'Identified via visual packaging formulation.',
                description: 'Assessed against FSSAI, US FDA, and EFSA standards.',
                regulatory_status: 'Permitted within standard statutory limits.',
              })),
              raw_ingredients_text: `Visual detection (${multiResult.packages.length} package${multiResult.packages.length > 1 ? 's' : ''} found)`,
              image_preview: selectedImage,
              allergen_alert: {
                detected: primary.allergen_alerts.length > 0,
                allergen_name: primary.allergen_alerts.join(', '),
                warning_type: 'Allergen Alert',
                message: primary.allergen_alerts.length > 0 
                  ? `Contains: ${primary.allergen_alerts.join(', ')}` 
                  : 'No critical allergen conflicts identified.',
              },
            };

            setAnalysisResult(completeMultiResult);
            return;
          }
        } catch (visionErr) {
          console.warn('Multi-package visual detection fallback:', visionErr);
        }
      }

      // MODE 2: BARCODE RESOLUTION (Web Search First, OpenFoodFacts as Fallback)
      let fetchedIngredients = userEnteredIngredients;
      let fetchedProductName = userEnteredName;
      let fetchedBrand = '';
      let offImageUrl = '';
      let offMatched = false;
      let offBase64Image: string | null = null;

      if (trimmedBarcode) {
        // Step A: Search retail databases via Google Search Grounding
        try {
          const verified = await crossVerifyBarcodeWithWeb(trimmedBarcode, '');
          if (verified?.verifiedTitle) {
            fetchedProductName = verified.verifiedTitle;
            if (verified.verifiedBrand) fetchedBrand = verified.verifiedBrand;
          }
        } catch (webErr) {
          console.warn('Live retail verification skipped:', webErr);
        }

        // Step B: If web search did not identify the product, query OpenFoodFacts
        if (!fetchedProductName) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const offRes = await fetch(
              `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmedBarcode)}.json`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (offRes.ok) {
              const offData = await offRes.json();
              if (offData.status === 1 && offData.product) {
                const p = offData.product;
                fetchedProductName = p.product_name || p.product_name_en || '';
                fetchedBrand = p.brands || '';
                fetchedIngredients = p.ingredients_text || p.ingredients_text_en || fetchedIngredients;
                offImageUrl = p.image_url || p.image_front_url || '';
                offMatched = Boolean(fetchedProductName);
              }
            }
          } catch (offErr) {
            console.warn('OpenFoodFacts fallback bypassed:', offErr);
          }
        }
      }

      const systemPrompt = `
You are FoodWise AI, an expert food safety toxicologist, clinical dietitian, and regulatory specialist (FSSAI, US FDA, EFSA, JECFA).

PATIENT CLINICAL & DEMOGRAPHIC PROFILE:
- User Age: ${userAge}
- Estimated Weight: ${userWeight}
- Health Conditions & Allergies: ${userSensitivitiesContext}
- Medical Records Context: ${activeReportsContext}
- Health Focus Flags: ${JSON.stringify(userPreferences)}

INPUT DATA:
- Barcode Number: ${trimmedBarcode || 'N/A'}
- Product Title: "${fetchedProductName || 'N/A'}"
- Brand: "${fetchedBrand || 'N/A'}"
- Ingredients: "${fetchedIngredients || 'N/A'}"

CRITICAL RULES:
1. STRICT PRODUCT IDENTITY:
   - Identify the exact product and variant.
   - Anchor your analysis strictly to the resolved product title: "${fetchedProductName}".
2. QUANTITATIVE ADI & AGE-BASED ASSESSMENT:
   - Factor in user age (${userAge}) and weight (${userWeight}).
   - Evaluate chemical additives against established Acceptable Daily Intake (ADI in mg/kg bw/day) thresholds (EFSA, JECFA, FSSAI).
3. ACCURATE ADDITIVE PARSING:
   - Extract ALL relevant chemical food additives with their specific INS / E-numbers.

Return strictly valid JSON:
{
  "scan_data": {
    "detected_product_name": "Accurate Product Name and Variant",
    "brand_name": "Accurate Brand Name",
    "barcode_detected": ${Boolean(trimmedBarcode)},
    "barcode_number": "${trimmedBarcode}",
    "openfoodfacts_matched": ${offMatched}
  },
  "product_info": {
    "total_additives_found": 0,
    "target_serving_size": "Standard single serve (e.g. 40g)",
    "age_group_evaluated": "${userAge}"
  },
  "overall_analysis": {
    "health_summary": "3-sentence clinical and toxicological evaluation tailored to the user's age and weight.",
    "key_warnings": ["Specific warning 1", "Specific warning 2"],
    "toxicological_note": "Detailed ADI calculation relative to user weight."
  },
  "additives_detected": [
    {
      "ins_e_number": "INS Number",
      "name": "Additive Name",
      "functional_class": "Functional Class",
      "safety_rating": "Safe / Caution / High Risk",
      "biological_mechanism": "Action mechanism",
      "description": "Functional description and intake guidance",
      "regulatory_status": "Status across FSSAI, FDA, EFSA"
    }
  ],
  "allergen_alert": {
    "detected": false,
    "allergen_name": "Identified Allergen",
    "warning_type": "Allergen Alert / Watch",
    "message": "Specific clinical allergen notice."
  }
}
`;

      const parts: any[] = [];
      const activeImage = selectedImage || offBase64Image;

      if (activeImage) {
        const cleanBase64 = activeImage.includes(',') ? activeImage.split(',')[1] : activeImage;
        const mimeType = activeImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        });
      }

      const textPayload = `
Barcode: ${trimmedBarcode || 'N/A'}
Product: ${fetchedProductName || 'Determine from visual/barcode'}
Brand: ${fetchedBrand || 'Determine from visual/barcode'}
Ingredients: ${fetchedIngredients || 'Examine formulation and extract additives'}
`;
      parts.push({ text: textPayload });

      const rawText = await generateContentWithKeyFallback(systemPrompt, parts);
      const parsedData = safeExtractJson(rawText);

      let finalProductName = parsedData.scan_data?.detected_product_name;
      if (!finalProductName || finalProductName === 'Scanned Food Product' || finalProductName.includes('Unverified Product')) {
        finalProductName = fetchedProductName || (trimmedBarcode ? `Product (${trimmedBarcode})` : 'Scanned Food Product');
      }

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
          target_serving_size: parsedData.product_info?.target_serving_size || 'Standard single serve',
          age_group_evaluated: userAge,
        },
        overall_analysis: {
          health_summary: parsedData.overall_analysis?.health_summary || 'Analysis complete.',
          key_warnings: Array.isArray(parsedData.overall_analysis?.key_warnings) ? parsedData.overall_analysis.key_warnings : [],
          toxicological_note: parsedData.overall_analysis?.toxicological_note || 'Evaluated against food safety standards.',
        },
        additives_detected: Array.isArray(parsedData.additives_detected) ? parsedData.additives_detected : [],
        raw_ingredients_text: fetchedIngredients || userEnteredIngredients || trimmedBarcode || 'Label Formulation Scan',
        image_preview: selectedImage || offImageUrl || undefined,
        allergen_alert: parsedData.allergen_alert || {
          detected: false,
          allergen_name: '',
          warning_type: '',
          message: ''
        },
      };

      setAnalysisResult(completeResult);
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('⏳ AI quota limit reached. Please try again shortly or configure an alternate API key.');
      } else {
        setErrorMsg(err.message || 'Analysis failed. Please verify document clarity and connectivity.');
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
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedScans.length}
        openPreferencesModal={() => setIsPrefsOpen(true)}
        activePreferenceCount={activePreferenceCount}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      <div className={`border-b py-2.5 px-4 text-xs transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
              Scientific Standard
            </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}>
              Personalised Food Suitability & Allergen Screening Engine
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
              <span>{isDark ? '☀️ Light' : '🌙 Dark'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowEthicalBoard(!showEthicalBoard)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg shadow-sm transition-all hover:border-emerald-500/60 active:scale-95 cursor-pointer flex-shrink-0"
            >
              <span>📋</span>
              <span>{showEthicalBoard ? 'Hide Framework' : 'Safety Framework'}</span>
            </button>
          </div>
        </div>
      </div>

      {showEthicalBoard && (
        <div className={`border-b p-5 text-sm ${
          isDark ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-100 border-emerald-500/40'
        }`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`border rounded-xl p-4 ${
              isDark ? 'bg-rose-950/30 border-rose-500/30 text-slate-300' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <h4 className="font-bold text-rose-500 text-base mb-2 flex items-center gap-2">
                ❌ FOODSENSE DOES NOT:
              </h4>
              <ul className="space-y-1.5 text-xs list-disc pl-5">
                <li>Diagnose clinical medical conditions or allergy pathology.</li>
                <li>Substitute for a licensed physician or certified clinical dietitian.</li>
                <li>Declare ingredients harmful without established toxicological criteria (NOAEL/ADI).</li>
              </ul>
            </div>
            <div className={`border rounded-xl p-4 ${
              isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-300' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <h4 className="font-bold text-emerald-600 text-base mb-2 flex items-center gap-2">
                ✅ FOODSENSE DOES:
              </h4>
              <ul className="space-y-1.5 text-xs list-disc pl-5">
                <li>Calculate Personalised Suitability based on individual profile context.</li>
                <li>Screen against FSSAI, US FDA, EFSA, and JECFA regulatory thresholds.</li>
                <li>Evaluate Acceptable Daily Intake (ADI) against age and body weight.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

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
                  {analysisResult.allergen_alert.message || 'Ingredient or trace warning detected. Verify physical packaging.'}
                </p>
                <div className="mt-2 text-xs bg-red-900/60 text-red-300 inline-block px-2.5 py-1 rounded-md border border-red-700/50">
                  Warning Type: {analysisResult.allergen_alert.warning_type || 'Direct Allergen Warning'}
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
              setBarcodeInput={(code) => {
                setBarcodeInput(code);
                if (code.trim()) {
                  setProductNameInput('');
                }
              }}
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

      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        isDark ? 'border-slate-800/80 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>FoodSense AI</span>
            <span>•</span>
            <span>Scientific Food Additive & Suitability Engine</span>
          </div>
          <div>
            FSSAI (India) • FDA (USA) • EFSA (EU) • JECFA Reference Standards
          </div>
        </div>
      </footer>

      <HealthChatbot />

      <CameraModal
        isOpen={isCameraOpen}
        mode={cameraMode}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedData, mode) => {
          if (mode === 'barcode') {
            setBarcodeInput(capturedData);
            setProductNameInput('');
          } else {
            setSelectedImage(capturedData);
          }
          setIsCameraOpen(false);
        }}
      />

      <AdditiveDetailModal
        additive={selectedAdditiveModal}
        onClose={() => setSelectedAdditiveModal(null)}
      />

      <PreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
        preferences={userPreferences}
        setPreferences={setUserPreferences}
      />
    </div>
  );
}