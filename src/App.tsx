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

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'health-profile' | 'directory' | 'calculator' | 'guide' | 'history'>('scanner');
  
  // User Authentication State (Default view is AuthScreen if not logged in)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading user profile from localStorage:', e);
    }
    return null;
  });

  // Scanner state
  const [ingredientInput, setIngredientInput] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<NutriScanResult | null>(null);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [selectedAdditiveModal, setSelectedAdditiveModal] = useState<AdditiveItem | null>(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState<boolean>(false);

  // User health preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading preferences from localStorage:', e);
    }
    return {
      asthmaSulfiteAlert: true,
      gutHealthFocus: true,
      kidsSafetyFocus: true,
      fssaiIndiaFocus: true,
      igeAllergyProne: true,
    };
  });

  // Saved history state
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

  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const handleAnalyze = async () => {
    if (!ingredientInput.trim() && !selectedImage && !barcodeInput.trim()) {
      setErrorMsg('Please enter a barcode number, ingredient text, or upload a label image.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ingredientInput,
          barcodeInput: barcodeInput,
          image: selectedImage,
          userPreferences,
          healthProfile: userProfile ? {
            symptoms: userProfile.symptoms,
            medicalReportAnalysis: userProfile.medicalReportAnalysis,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: NutriScanResult = await response.json();
      data.id = `scan-${Date.now()}`;
      data.timestamp = new Date().toISOString();
      data.raw_ingredients_text = ingredientInput || barcodeInput;
      if (selectedImage) {
        data.image_preview = selectedImage;
      }

      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'Failed to complete NutriScan AI analysis. Please check network connection or try again.');
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
  };

  const handleResetScan = () => {
    setAnalysisResult(null);
    setIngredientInput('');
    setBarcodeInput('');
    setSelectedImage(null);
    setErrorMsg(null);
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
  };

  const isCurrentScanSaved = Boolean(
    analysisResult && savedScans.some((s) => s.id === analysisResult.id)
  );

  const activePreferenceCount = Object.values(userPreferences).filter(Boolean).length;

  // Default view is User Login / Registration Screen if user is not authenticated
  if (!userProfile || !userProfile.isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
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

      {/* Error Alert Toast */}
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

      {/* Main Content Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
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
              ingredientInput={ingredientInput}
              setIngredientInput={setIngredientInput}
              barcodeInput={barcodeInput}
              setBarcodeInput={setBarcodeInput}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              userPreferences={userPreferences}
              openCamera={() => setIsCameraOpen(true)}
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
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">NutriScan AI</span>
            <span>•</span>
            <span>Scientific Food Additive & Ingredient Safety Engine</span>
          </div>
          <div className="text-slate-400">
            FSSAI (India) • FDA (USA) • EFSA (EU) Reference Standards
          </div>
        </div>
      </footer>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => {
          setSelectedImage(img);
          setIsCameraOpen(false);
        }}
      />

      {/* Additive Toxicology Detail Modal */}
      <AdditiveDetailModal
        additive={selectedAdditiveModal}
        onClose={() => setSelectedAdditiveModal(null)}
      />

      {/* Health Sensitivity Preferences Modal */}
      <PreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
        preferences={userPreferences}
        setPreferences={setUserPreferences}
      />
    </div>
  );
}
