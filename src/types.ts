export type SafetyRating = 'Safe' | 'Caution' | 'High Concern';

export interface AdditiveItem {
  name: string;
  ins_e_number: string;
  functional_class: string;
  biological_mechanism: string;
  regulatory_status: string;
  safety_rating: SafetyRating;
  description: string;
  noael_mg_kg?: number;
  adi_mg_kg?: number;
  fssai_limit_ppm?: string;
  common_foods?: string[];
}

export interface ScanData {
  barcode_detected: boolean;
  barcode_number: string | null;
  detected_product_name: string;
  openfoodfacts_matched?: boolean;
  brand_name?: string;
}

export interface ProductInfo {
  total_additives_found: number;
}

export interface OverallAnalysis {
  health_summary: string;
  key_warnings: string[];
  toxicological_note?: string;
  additive_count?: number; // legacy fallback support
}

export interface AllergenAlert {
  detected: boolean;
  allergen_name?: string;
  message?: string;
  warning_type?: string;
}

export interface NutriScanResult {
  id?: string;
  timestamp?: string;
  scan_data?: ScanData;
  product_info?: ProductInfo;
  product_name?: string; // fallback if older format
  additives_detected: AdditiveItem[];
  overall_analysis: OverallAnalysis;
  raw_ingredients_text?: string;
  image_preview?: string;
  off_image_url?: string;
  allergen_alert?: AllergenAlert;
  suitability_score?: number;
  overall_status?: 'Suitable' | 'Caution' | 'Unsuitable';
}

export interface UserPreferences {
  asthmaSulfiteAlert: boolean;
  gutHealthFocus: boolean;
  kidsSafetyFocus: boolean;
  fssaiIndiaFocus: boolean;
  igeAllergyProne: boolean;
  customSensitivities?: string[];
}

export interface AdditiveToAvoid {
  ins_e_number: string;
  name: string;
  reason: string;
}

export interface HealthReportAnalysis {
  patient_summary: string;
  diagnosed_sensitivities: string[];
  additives_to_avoid: AdditiveToAvoid[];
  suggested_preferences?: Partial<UserPreferences>;
  dietary_recommendations: string[];
  medical_disclaimer: string;
}

// Single Medical Report Record
export interface MedicalReport {
  id: string;
  title: string;
  reportDate: string;
  category: 'Allergy Panel' | 'Blood Work' | 'Gastroenterology' | 'Endocrine' | 'General Diagnostics';
  reportText: string;
  filePreview?: string;
  analysis?: HealthReportAnalysis;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  isLoggedIn: boolean;
  symptoms: string;
  medicalReportFileName?: string;
  medicalReportAnalysis?: HealthReportAnalysis;
  medicalReports?: MedicalReport[]; // Supports storing multiple saved lab/diagnostic reports
  customAllergens?: string[];
}

export interface PresetSample {
  id: string;
  name: string;
  category: string;
  ingredientsText: string;
  description: string;
  sampleImage?: string;
  barcodeNumber?: string;
}