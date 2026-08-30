import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Mail, 
  HeartPulse, 
  ShieldCheck, 
  Calendar, 
  Edit2, 
  Save,
  UploadCloud,
  File,
  Loader2,
  Sparkles,
  AlertCircle,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, UserPreferences, MedicalReport } from '../types';

interface HealthProfileTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  userPreferences: UserPreferences;
  setUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

interface ClinicalSynthesis {
  headline: string;
  keyConditions: string[];
  dietaryRisks: string[];
  recommendations: string[];
  lastEvaluated: string;
}

interface MedicalExtractionResult {
  summary: string;
  diagnosed_sensitivities: string[];
  additives_to_avoid: string[];
}

export const HealthProfileTab: React.FC<HealthProfileTabProps> = ({
  userProfile,
  setUserProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [symptoms, setSymptoms] = useState(
    Array.isArray(userProfile.symptoms) ? userProfile.symptoms.join(', ') : (userProfile.symptoms || '')
  );

  // Analysis State (Controlled manually by button)
  const [analysis, setAnalysis] = useState<ClinicalSynthesis | null>(null);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Manual Add Form State
  const [showAddReport, setShowAddReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<MedicalReport['category']>('Allergy Panel');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportText, setReportText] = useState('');

  // File Upload State
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reports = userProfile.medicalReports || [];

  // Helper function: Document Extractor
  const extractMedicalDocument = async (
    base64Data: string,
    mimeType: string
  ): Promise<MedicalExtractionResult> => {
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is missing in your .env file');
    }

    const ai = new GoogleGenAI({ apiKey });
    const validMimeType = mimeType || (cleanBase64.startsWith('JVBERi0') ? 'application/pdf' : 'image/jpeg');

    const prompt = `
You are an expert clinical dietitian and medical record analyzer.
Read this medical document and extract:
1. All diagnosed clinical conditions, health issues, allergies, and food sensitivities.
2. Specific food ingredients, chemical additives, preservatives, artificial colorings, or sweeteners the patient must avoid.
3. A clear 2-3 sentence clinical summary of the patient's health findings.

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Concise 2-3 sentence overview of medical findings",
  "diagnosed_sensitivities": ["Condition or Allergy 1", "Condition 2"],
  "additives_to_avoid": ["Ingredient/Additive 1", "Additive 2"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: validMimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const sanitizedText = rawText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(sanitizedText || '{}');

    return {
      summary: parsed.summary || 'Clinical record reviewed and active triggers recorded.',
      diagnosed_sensitivities: Array.isArray(parsed.diagnosed_sensitivities) ? parsed.diagnosed_sensitivities : [],
      additives_to_avoid: Array.isArray(parsed.additives_to_avoid) ? parsed.additives_to_avoid : [],
    };
  };

  // Button Action: Analyze full health profile on demand
  const handleAnalyzeHealthProfile = async () => {
    setIsAnalyzingHealth(true);
    setAnalysisError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured in .env');

      const ai = new GoogleGenAI({ apiKey });

      const reportsContext = reports
        .map((r, i) => `Report ${i + 1} (${r.title || 'Untitled'} - ${r.reportDate || 'N/A'}): ${r.reportText || ''}`)
        .join('\n');

      const prompt = `
You are a senior clinical nutritionist and health assessor.
Analyze the user's complete profile and generate an exhaustive health overview:
- Active Symptoms / Allergies: ${userProfile.symptoms || 'None listed'}
- Attached Medical Reports & Diagnoses:
${reportsContext || 'No medical reports attached'}

Analyze the health baseline and return ONLY a strict JSON object with this exact schema:
{
  "headline": "1 clear sentence summarizing overall current health baseline and primary focus",
  "keyConditions": ["Identified health factor/allergy 1", "Condition 2"],
  "dietaryRisks": ["Specific additive or ingredient to screen out 1", "Additive 2"],
  "recommendations": ["Actionable dietary guideline 1", "Guideline 2", "Guideline 3"]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const sanitizedText = rawText.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(sanitizedText || '{}');

      setAnalysis({
        headline: parsed.headline || 'Health baseline evaluated.',
        keyConditions: Array.isArray(parsed.keyConditions) && parsed.keyConditions.length > 0 ? parsed.keyConditions : [userProfile.symptoms || 'General Health Active'],
        dietaryRisks: Array.isArray(parsed.dietaryRisks) && parsed.dietaryRisks.length > 0 ? parsed.dietaryRisks : ['High sodium', 'Ultra-processed preservatives'],
        recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0 ? parsed.recommendations : ['Always screen packaged food labels for additives.'],
        lastEvaluated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Failed to synthesize profile.');
    } finally {
      setIsAnalyzingHealth(false);
    }
  };

  const handleSaveProfile = () => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        name: name.trim() || prev.name,
        email: email.trim() || prev.email,
        symptoms: symptoms.trim() as any,
      };
      localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(updated));
      return updated;
    });
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsAnalyzingFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      try {
        const aiResult = await extractMedicalDocument(base64Data, mimeType);

        let extractedSummary = '';
        if (aiResult.diagnosed_sensitivities?.length) {
          extractedSummary += `Sensitivities: ${aiResult.diagnosed_sensitivities.join(', ')}. `;
        }
        if (aiResult.additives_to_avoid?.length) {
          extractedSummary += `Avoid: ${aiResult.additives_to_avoid.join(', ')}. `;
        }
        if (aiResult.summary) {
          extractedSummary += `Clinical Summary: ${aiResult.summary}`;
        }

        const newReport: MedicalReport = {
          id: `rep-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: file.name.toLowerCase().includes('blood') ? 'Blood Work' : 'General Diagnostics',
          reportDate: new Date().toISOString().split('T')[0],
          reportText: extractedSummary || 'Clinical findings extracted from document.',
          createdAt: new Date().toISOString(),
        };

        const updatedReports = [newReport, ...reports];
        setUserProfile((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            medicalReports: updatedReports,
            medicalReportAnalysis: aiResult,
          };
          localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(updated));
          return updated;
        });
      } catch (err: any) {
        console.error('File parsing error:', err);
        setUploadError(err.message || 'Failed to analyze medical file.');
      } finally {
        setIsAnalyzingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleManualAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportText.trim()) return;

    const newReport: MedicalReport = {
      id: `rep-${Date.now()}`,
      title: reportTitle.trim(),
      category: reportCategory,
      reportDate: reportDate || new Date().toISOString().split('T')[0],
      reportText: reportText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedReports = [newReport, ...reports];
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, medicalReports: updatedReports };
      localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(updated));
      return updated;
    });

    setReportTitle('');
    setReportText('');
    setShowAddReport(false);
  };

  const handleDeleteReport = (id: string) => {
    const updatedReports = reports.filter((r) => r.id !== id);
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, medicalReports: updatedReports };
      localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      
      {/* 1. Profile Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {userProfile.picture ? (
              <img 
                src={userProfile.picture} 
                alt={userProfile.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg shadow-emerald-500/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{userProfile.name}</h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Active Profile
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{userProfile.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditing) handleSaveProfile();
              else setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {isEditing ? (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Profile</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Details</span>
              </>
            )}
          </button>
        </div>

        {/* Symptoms / Sensitivities Row */}
        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">Active Symptoms / Sensitivities</label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Celiac, Peanuts, Lactose intolerance, GERD"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-300">Recorded Symptoms & Sensitivities:</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {typeof userProfile.symptoms === 'string' && userProfile.symptoms.trim()
                  ? userProfile.symptoms
                  : Array.isArray(userProfile.symptoms) && userProfile.symptoms.length > 0
                  ? userProfile.symptoms.join(', ')
                  : 'No specific allergies or symptoms entered.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Manual Action: "Analyze Profile" & Summary Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Clinical Health & Dietary Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click below to synthesize symptoms, uploaded medical files, and food risks with Gemini AI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeHealthProfile}
            disabled={isAnalyzingHealth}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isAnalyzingHealth ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Health Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{analysis ? 'Re-Analyze Profile' : 'Analyze Health Profile'}</span>
              </>
            )}
          </button>
        </div>

        {analysisError && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Rendered Summary Box */}
        {analysis ? (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            {/* Headline Banner */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl">
              <div className="flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-300">Executive Summary: </span>
                  <span className="text-xs text-slate-300">{analysis.headline}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 text-right">
                Synthesized at {analysis.lastEvaluated}
              </div>
            </div>

            {/* Conditions & Flagged Ingredients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Identified Health Factors / Diagnoses</span>
                </div>
                <ul className="space-y-1">
                  {analysis.keyConditions.map((cond, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Flagged Ingredients & Additives</span>
                </div>
                <ul className="space-y-1">
                  {analysis.dietaryRisks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Nutrition Guidelines */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Personalized Nutrition Guidance</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          !isAnalyzingHealth && (
            <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
              Click <strong className="text-emerald-400">"Analyze Health Profile"</strong> above to extract conditions and dietary rules across your profile.
            </div>
          )
        )}
      </div>

      {/* 3. File Upload Area for Medical Documents */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            Upload Medical Reports & Documents
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload PDF lab reports, blood work photos, or doctor notes. AI will extract contraindications automatically.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div
          onClick={() => !isAnalyzingFile && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isAnalyzingFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-700 hover:border-emerald-500/60 hover:bg-slate-950/50'
          }`}
        >
          {isAnalyzingFile ? (
            <>
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Reading Medical Document via Gemini Vision...
                </p>
                <p className="text-xs text-slate-400 mt-1">Extracting clinical diagnoses, allergen markers & restricted additives</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <File className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Click to Upload PDF, Image, or Photo</p>
                <p className="text-[11px] text-slate-500 mt-1">Supports PDF, PNG, JPG (e.g., Allergy Tests, Lab Summaries)</p>
              </div>
            </>
          )}
        </div>

        {uploadError && (
          <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* 4. Active Medical Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Active Medical Reports ({reports.length})
          </h3>

          <button
            onClick={() => setShowAddReport(!showAddReport)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manual Entry</span>
          </button>
        </div>

        {showAddReport && (
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleManualAddReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Report Title *</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Allergy IgE Blood Test"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Allergy Panel">Allergy Panel</option>
                    <option value="Blood Work">Blood Work</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Endocrine">Endocrine</option>
                    <option value="General Diagnostics">General Diagnostics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Findings / Food Restrictions *</label>
                <textarea
                  required
                  rows={3}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="e.g., Avoid MSG, sulfites, and red dye 40..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReport(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {report.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">{report.title}</h4>
                </div>
                <button
                  onClick={() => handleDeleteReport(report.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{report.reportDate}</span>
              </div>
              <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl leading-relaxed">
                {report.reportText}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};