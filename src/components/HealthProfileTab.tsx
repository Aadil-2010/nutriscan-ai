import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  User, 
  Mail, 
  HeartPulse, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Edit2, 
  Save 
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userProfile.name || '');
  const [editEmail, setEditEmail] = useState(userProfile.email || '');
  const [editSymptoms, setEditSymptoms] = useState(
    Array.isArray(userProfile.symptoms) ? userProfile.symptoms.join(', ') : (userProfile.symptoms || '')
  );

  // New report form states
  const [showAddReport, setShowAddReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<MedicalReport['category']>('Allergy Panel');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportText, setReportText] = useState('');

  const reports = userProfile.medicalReports || [];

  const handleSaveProfileInfo = () => {
    setUserProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: editName.trim() || prev.name,
        email: editEmail.trim() || prev.email,
        symptoms: editSymptoms.trim() as any,
      };
    });
    setIsEditingProfile(false);
  };

  const handleAddReport = (e: React.FormEvent) => {
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
      return {
        ...prev,
        medicalReports: updatedReports,
      };
    });

    setReportTitle('');
    setReportText('');
    setShowAddReport(false);
  };

  const handleDeleteReport = (id: string) => {
    const updatedReports = reports.filter((r) => r.id !== id);
    setUserProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        medicalReports: updatedReports,
      };
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* 1. Account Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{userProfile.name || 'Anonymous User'}</h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Verified Account
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{userProfile.email || 'No email attached'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditingProfile) {
                handleSaveProfileInfo();
              } else {
                setIsEditingProfile(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {isEditingProfile ? (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Editable User Information */}
        {isEditingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">Recorded Symptoms & Food Sensitivities</label>
              <input
                type="text"
                value={editSymptoms}
                onChange={(e) => setEditSymptoms(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-300">Active Medical Symptoms & Sensitivities:</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {typeof userProfile.symptoms === 'string' && userProfile.symptoms.trim()
                  ? userProfile.symptoms
                  : Array.isArray(userProfile.symptoms) && userProfile.symptoms.length > 0
                  ? userProfile.symptoms.join(', ')
                  : 'No specific symptoms entered. (Click Edit Profile to add)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Medical Diagnostic Records Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Medical & Diagnostic Lab Reports ({reports.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Add reports to have the food scanner automatically cross-reference ingredients.
          </p>
        </div>

        <button
          onClick={() => setShowAddReport(!showAddReport)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medical Report</span>
        </button>
      </div>

      {/* Add Report Form */}
      {showAddReport && (
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleAddReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. IgE Blood Test, Endoscopy, Histamine Panel"
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
              <label className="block text-xs font-bold text-slate-300 mb-1">Clinical Findings *</label>
              <textarea
                required
                rows={3}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="e.g., Avoid sulfur dioxide, peanut derivatives, high artificial additives..."
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
                Save Report
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
  );
};