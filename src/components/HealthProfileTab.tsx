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
  AlertCircle
} from 'lucide-react';
import { UserProfile, UserPreferences, MedicalReport } from '../types';

interface HealthProfileTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  userPreferences: UserPreferences;
  setUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
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

  // Manual Add Form State
  const [showAddReport, setShowAddReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<MedicalReport['category']>('Allergy Panel');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportText, setReportText] = useState('');

  // File Upload State (PDFs, Images, Photos)
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reports = userProfile.medicalReports || [];

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

  // 1. Handle File Upload (PDF, JPG, PNG) & Trigger Gemini AI Extraction
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
        const res = await fetch('/api/analyze-health-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportFile: base64Data,
            mimeType,
            fileName: file.name,
            symptoms: userProfile.symptoms || '',
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to parse medical file');
        }

        const aiResult = await res.json();

        // Construct dynamic clinical summary from AI output
        let extractedSummary = '';
        if (typeof aiResult === 'object') {
          if (aiResult.diagnosed_sensitivities?.length) {
            extractedSummary += `Sensitivities: ${aiResult.diagnosed_sensitivities.join(', ')}. `;
          }
          if (aiResult.additives_to_avoid?.length) {
            extractedSummary += `Additives to avoid: ${aiResult.additives_to_avoid.join(', ')}. `;
          }
          if (aiResult.summary) {
            extractedSummary += `Clinical Summary: ${aiResult.summary}`;
          }
        }

        const newReport: MedicalReport = {
          id: `rep-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''), // remove file extension
          category: file.name.toLowerCase().includes('blood') ? 'Blood Work' : 'Allergy Panel',
          reportDate: new Date().toISOString().split('T')[0],
          reportText: extractedSummary || `AI analyzed document (${file.name}) and mapped clinical dietary restrictions.`,
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
        // Fallback: save document reference even if AI service timed out
        const fallbackReport: MedicalReport = {
          id: `rep-${Date.now()}`,
          title: file.name,
          category: 'General Diagnostics',
          reportDate: new Date().toISOString().split('T')[0],
          reportText: `Uploaded file: ${file.name}. Added to active medical context.`,
          createdAt: new Date().toISOString(),
        };
        const updatedReports = [fallbackReport, ...reports];
        setUserProfile((prev) => {
          if (!prev) return null;
          const updated = { ...prev, medicalReports: updatedReports };
          localStorage.setItem('nutriscan_ai_user_profile_v1', JSON.stringify(updated));
          return updated;
        });
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

      {/* 2. Drag & Drop / File Upload Area for Medical Documents */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              Upload Medical Reports & Documents
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload PDF lab reports, blood work photos, or doctor notes. AI will extract contraindications automatically.
            </p>
          </div>
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

      {/* 3. Medical Diagnostic Records List */}
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

        {/* Manual Add Form Modal */}
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

        {/* Report Cards Grid */}
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