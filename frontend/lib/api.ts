/**
 * Transit Scope - Frontend Scientific API Client
 * Interfaces with the FastAPI scientific backend for live data retrieval and model execution.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TargetCatalogItem {
  toi_id: string;
  tic_id: string;
  disposition: string;
  period_days: number | null;
  duration_hours: number | null;
  depth_ppm: number | null;
  tess_mag: number | null;
  teff_k: number | null;
  stellar_radius_solar: number | null;
  stellar_mass_solar: number | null;
  ra_deg: number | null;
  dec_deg: number | null;
  sectors: string | null;
  has_lightcurve: boolean;
  is_cached_demo: boolean;
  epoch_bjd: number | null;
}

export interface TargetSearchResponse {
  query: string;
  total_found: number;
  results: TargetCatalogItem[];
  source: string;
}

export interface LightCurvePoint {
  time: number;
  flux: number;
  flux_err?: number | null;
  phase?: number | null;
}

export interface FoldedBinPoint {
  phase: number;
  flux: number;
  error?: number | null;
  count?: number | null;
  model_fit?: number | null;
}

export interface LightCurveSet {
  toi_id: string;
  tic_id: string;
  period_days: number;
  epoch_bjd: number;
  sectors: number[];
  cadence_seconds: number;
  raw_points: LightCurvePoint[];
  cleaned_points: LightCurvePoint[];
  flattened_points: LightCurvePoint[];
  folded_points: LightCurvePoint[];
  binned_folded: FoldedBinPoint[];
  summary_notes: Record<string, string>;
}

export interface SignalFeatures {
  toi_id: string;
  tic_id: string;
  transit_depth_ppm: number;
  transit_duration_hours: number;
  signal_to_noise: number;
  odd_even_depth_diff_ppm: number;
  secondary_eclipse_depth_ppm: number;
  in_transit_scatter: number;
  out_of_transit_scatter: number;
  odd_depth_ppm: number;
  even_depth_ppm: number;
  secondary_snr: number;
  transit_asymmetry: number;
  in_transit_point_count: number;
  is_valid: boolean;
  calculation_warnings: string[];
  explanations: Record<string, string>;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  description: string;
  direction?: string | null;
}

export interface ClassificationPrediction {
  toi_id: string;
  predicted_class: "Planet" | "False Positive";
  planet_probability: number;
  false_positive_probability: number;
  confidence_level: "High" | "Moderate" | "Low";
  model_name: string;
  feature_configuration: string;
  top_contributing_features: FeatureImportanceItem[];
  astronomical_reasoning: string;
  scientific_limitations: string[];
}

export interface ModelEvaluationMetrics {
  model_name: string;
  feature_configuration: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: number[][];
  class_distribution: Record<string, number>;
  group_split_strategy: string;
  feature_importances: FeatureImportanceItem[];
  training_sample_count: number;
  test_sample_count: number;
}

export interface ModelIntelligenceResponse {
  models: ModelEvaluationMetrics[];
  experimental_conclusion: string;
  does_lightcurve_improve: boolean;
  insight_analysis: string;
}

export interface FullAnalysisReport {
  analysis_id: string;
  timestamp: string;
  target: TargetCatalogItem;
  light_curves: LightCurveSet;
  features: SignalFeatures;
  prediction_combined: ClassificationPrediction;
  prediction_catalog: ClassificationPrediction;
  prediction_lightcurve: ClassificationPrediction;
  data_quality_flags: string[];
  scientific_disclaimer: string;
}

/** Check backend health */
export async function getBackendHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

/** Get verified observatory example targets */
export async function getExampleTargets(): Promise<TargetCatalogItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/targets/examples`);
  if (!res.ok) throw new Error("Failed to fetch example targets");
  return res.json();
}

/** Search NASA TOI database by query string */
export async function searchTargets(query: string): Promise<TargetSearchResponse> {
  const res = await fetch(`${API_BASE_URL}/api/targets/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Target search failed");
  return res.json();
}

/** Get single target details */
export async function getTargetDetails(toiId: string): Promise<TargetCatalogItem> {
  const res = await fetch(`${API_BASE_URL}/api/targets/${encodeURIComponent(toiId)}`);
  if (!res.ok) throw new Error(`Target ${toiId} not found`);
  return res.json();
}

/** Execute full scientific analysis */
export async function runAnalysis(toiId: string, useMast: boolean = false): Promise<FullAnalysisReport> {
  const res = await fetch(`${API_BASE_URL}/api/analysis/${encodeURIComponent(toiId)}?use_mast=${useMast}`, {
    method: "POST"
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Analysis failed: ${errorBody || res.statusText}`);
  }
  return res.json();
}

/** Get previously generated analysis report */
export async function getAnalysisReport(analysisId: string): Promise<FullAnalysisReport> {
  const res = await fetch(`${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}`);
  if (!res.ok) throw new Error(`Report ${analysisId} not found`);
  return res.json();
}

/** Get machine learning evaluation metrics */
export async function getModelMetrics(): Promise<ModelIntelligenceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/models/metrics`);
  if (!res.ok) throw new Error("Failed to load model metrics");
  return res.json();
}

/** Get PDF download URL */
export function getPdfDownloadUrl(analysisId: string): string {
  return `${API_BASE_URL}/api/reports/${encodeURIComponent(analysisId)}?format=pdf`;
}
