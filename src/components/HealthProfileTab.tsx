import React, { useState } from 'react';
import { 
  Activity, 
  FileText, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Trash2, 
  Stethoscope, 
  Info, 
  ArrowRight,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { UserProfile, HealthReportAnalysis, UserPreferences } from '../types';

interface HealthProfileTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  userPreferences: UserPreferences;
  setUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const COMMON_SYMPTOMS = [
  'Asthma / Wheezing after cold drinks',
  'Skin Hives / Eczema flare-ups',
  'Severe Bloating & Acid Reflux',
  'Migraines & Throbbing Headaches',
  'Oral Allergy / Swollen Lip or Tongue',
  'Elevated Serum Uric Acid / Joint Pain',
  'Hyperactivity or Restlessness in Kids',
  'Histamine Flush / Sudden Facial Redness',
];

export const HealthProfileTab: React.FC<HealthProfileTabProps> = ({
  userProfile,
  setUserProfile,
  setUserPreferences,
}) => {
  const [symptomsInput, setSymptomsInput] = useState<string>(userProfile.symptoms || '');
  const [reportFile, setReportFile] = useState<{
    name: string;
    base64: string;
    type: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<HealthReportAnalysis | null>(
    userProfile.medicalReportAnalysis || null
  );

  const handleSymptomToggle = (symptomTag: string) => {
    if (symptomsInput.includes(symptomTag)) {
      setSymptomsInput(
        symptomsInput
          .replace(symptomTag, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*|\s*,\s*$/g, '')
      );
    } else {
      setSymptomsInput(
        symptomsInput ? `${symptomsInput}, ${symptomTag}` : symptomTag
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setAnalysisError('File size exceeds 15MB limit. Please upload a smaller PDF or image report.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setReportFile({
        name: file.name,
        base64: base64String,
        type: file.type || 'application/pdf',
      });
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAiAnalysis = async () => {
    if (!symptomsInput.trim() && !reportFile) {
      setAnalysisError('Please enter your symptoms or upload a PDF/image medical report.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-health-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptomsInput,
          reportFile: reportFile?.base64,
          mimeType: reportFile?.type,
          fileName: reportFile?.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Medical report analysis failed.');
      }

      const result: HealthReportAnalysis = await response.json();
      setAnalysisResult(result);

      // Save to user profile state
      const updatedProfile: UserProfile = {
        ...userProfile,
        symptoms: symptomsInput,
        medicalReportFileName: reportFile?.name || userProfile.medicalReportFileName,
        medicalReportAnalysis: result,
      };
      setUserProfile(updatedProfile);

      // Auto-apply suggested preferences if returned
      if (result.suggested_preferences) {
        setUserPreferences((prev) => ({
          ...prev,
          ...result.suggested_preferences,
        }));
      }
    } catch (err: any) {
      console.error('Report analysis error:', err);
      setAnalysisError(err.message || 'Failed to analyze health report.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20">
            <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
            <span>AI Clinical Toxicology & Diagnostic Report Parser</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
            Personal Health Profile & Medical PDF Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Upload your medical blood tests, allergy panels, or doctor report PDFs alongside your current health symptoms. NutriScan AI extracts specific chemical sensitivities and maps E-Numbers to protect you when scanning foods.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column: Symptoms & PDF Upload */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Logged In Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{userProfile.name}</h3>
                <p className="text-xs text-slate-400">{userProfile.email}</p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Active Session
            </span>
          </div>

          {/* Symptoms Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Current Symptoms & Allergies
              </label>
              <span className="text-xs text-slate-400">Select or type</span>
            </div>

            {/* Symptom Tag Pills */}
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => {
                const isSelected = symptomsInput.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all text-left flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{symptom}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Symptom Textarea */}
            <div>
              <textarea
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="Type additional health symptoms, doctor diagnoses, or food reactions..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Medical PDF Report Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Upload Medical Lab Report (PDF / Image)
              </label>
              <span className="text-xs text-slate-400">PDF, PNG, JPG (Max 15MB)</span>
            </div>

            {reportFile ? (
              <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-teal-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{reportFile.name}</p>
                    <p className="text-[10px] text-teal-400 font-medium">Ready for AI Analysis</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReportFile(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remove report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-teal-500/60 bg-slate-950/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-teal-400 transition-colors mb-2" />
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Drop your PDF Medical Report here or <span className="text-teal-400 underline">Browse Files</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports IgE Allergy panels, blood tests, gastroenterology notes
                </p>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {analysisError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing || (!symptomsInput.trim() && !reportFile)}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Scanning Medical Report with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Report & Symptoms with AI</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right Output Column: AI Medical Diagnostic Results */}
        <div className="lg:col-span-6 space-y-6">
          {analysisResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-base text-white">AI Diagnostic & Sensitivity Report</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
                  Gemini Verified
                </span>
              </div>

              {/* Patient Summary */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                  Clinical Impression
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysisResult.patient_summary}
                </p>
              </div>

              {/* Diagnosed Sensitivities */}
              {analysisResult.diagnosed_sensitivities?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                    Identified Health Flags & Sensitivities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.diagnosed_sensitivities.map((sens, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold"
                      >
                        ⚠️ {sens}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additives to Avoid Table / Cards */}
              {analysisResult.additives_to_avoid?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    High-Risk Additives & E-Numbers To Avoid
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.additives_to_avoid.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">{item.name}</span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {item.ins_e_number}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Recommendations */}
              {analysisResult.dietary_recommendations?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    Personalized Food Safety Guidance
                  </h4>
                  <ul className="space-y-1.5">
                    {analysisResult.dietary_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-400">Medical Disclaimer: </span>
                {analysisResult.medical_disclaimer}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Medical Report Analyzed Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Select your symptoms or upload a PDF medical scan on the left. Gemini AI will parse your diagnostic report and automatically configure your NutriScan additive safety shields.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
