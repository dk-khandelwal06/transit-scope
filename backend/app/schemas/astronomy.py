"""
Transit Scope - Astronomical and Machine Learning Pydantic Schemas
Strict validation for TOI targets, light curves, extracted features, and classification.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class TargetCatalogItem(BaseModel):
    toi_id: str = Field(..., description="TESS Object of Interest identifier, e.g. TOI-700.01")
    tic_id: str = Field(..., description="TESS Input Catalog ID, e.g. 150428135")
    disposition: str = Field(..., description="Astronomical disposition: CP (Confirmed Planet), KP (Known Planet), PC (Planet Candidate), FP (False Positive)")
    period_days: Optional[float] = Field(None, description="Orbital period in days")
    duration_hours: Optional[float] = Field(None, description="Transit duration in hours")
    depth_ppm: Optional[float] = Field(None, description="Transit depth in parts per million")
    tess_mag: Optional[float] = Field(None, description="TESS band apparent magnitude")
    teff_k: Optional[float] = Field(None, description="Stellar effective temperature in Kelvin")
    stellar_radius_solar: Optional[float] = Field(None, description="Stellar radius in solar radii")
    stellar_mass_solar: Optional[float] = Field(None, description="Stellar mass in solar masses")
    ra_deg: Optional[float] = Field(None, description="Right Ascension in decimal degrees")
    dec_deg: Optional[float] = Field(None, description="Declination in decimal degrees")
    sectors: Optional[str] = Field(None, description="TESS observing sectors list")
    has_lightcurve: bool = Field(True, description="Whether TESS light-curve observations are available")
    is_cached_demo: bool = Field(False, description="Whether this is a validated pre-processed observatory target")
    epoch_bjd: Optional[float] = Field(None, description="Transit epoch reference (BJD - 2457000 or full BJD)")


class TargetSearchResponse(BaseModel):
    query: str
    total_found: int
    results: List[TargetCatalogItem]
    source: str = Field(..., description="Source of data (Live NASA TAP or Verified Observatory Archive)")


class LightCurvePoint(BaseModel):
    time: float = Field(..., description="Time coordinate (BJD - 2457000)")
    flux: float = Field(..., description="Normalized relative stellar flux")
    flux_err: Optional[float] = Field(None, description="Flux measurement uncertainty")
    phase: Optional[float] = Field(None, description="Orbital phase normalized to [-0.5, 0.5]")


class FoldedBinPoint(BaseModel):
    phase: float
    flux: float
    error: Optional[float] = None
    count: Optional[int] = None
    model_fit: Optional[float] = None


class LightCurveSet(BaseModel):
    toi_id: str
    tic_id: str
    period_days: float
    epoch_bjd: float
    sectors: List[int]
    cadence_seconds: float
    raw_points: List[LightCurvePoint]
    cleaned_points: List[LightCurvePoint]
    flattened_points: List[LightCurvePoint]
    folded_points: List[LightCurvePoint]
    binned_folded: List[FoldedBinPoint]
    summary_notes: Dict[str, str] = Field(default_factory=dict)


class SignalFeatures(BaseModel):
    toi_id: str
    tic_id: str
    # Primary required model features
    transit_depth_ppm: float = Field(..., description="Measured transit dip depth in parts per million")
    transit_duration_hours: float = Field(..., description="Calculated transit duration in hours")
    signal_to_noise: float = Field(..., description="Empirical signal-to-noise ratio of the phase-aligned transit")
    odd_even_depth_diff_ppm: float = Field(..., description="Absolute depth difference between odd and even transits in ppm")
    secondary_eclipse_depth_ppm: float = Field(..., description="Depth measured at anti-phase (phase = 0.5) in ppm")
    in_transit_scatter: float = Field(..., description="Normalized standard deviation of flux measurements inside the transit window")
    
    # Diagnostic / secondary measurements
    out_of_transit_scatter: float = Field(..., description="Normalized standard deviation of baseline out-of-transit flux")
    odd_depth_ppm: float = Field(..., description="Mean depth of odd transits in ppm")
    even_depth_ppm: float = Field(..., description="Mean depth of even transits in ppm")
    secondary_snr: float = Field(..., description="Signal-to-noise ratio at phase 0.5 secondary eclipse")
    transit_asymmetry: float = Field(..., description="Metric of transit shape asymmetry (ingress vs egress slope)")
    in_transit_point_count: int = Field(..., description="Number of observed cadences inside transit")
    
    # Validation status
    is_valid: bool = Field(True, description="Whether features passed scientific quality validation")
    calculation_warnings: List[str] = Field(default_factory=list)
    explanations: Dict[str, str] = Field(default_factory=dict)


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    description: str
    direction: Optional[str] = None  # e.g. "Favors Planet" or "Favors False Positive"


class ClassificationPrediction(BaseModel):
    toi_id: str
    predicted_class: str = Field(..., description="'Planet' or 'False Positive'")
    planet_probability: float = Field(..., ge=0.0, le=1.0)
    false_positive_probability: float = Field(..., ge=0.0, le=1.0)
    confidence_level: str = Field(..., description="'High', 'Moderate', or 'Low'")
    model_name: str
    feature_configuration: str = Field(..., description="'Combined', 'Light-Curve Features Only', or 'Catalog-Only'")
    top_contributing_features: List[FeatureImportanceItem]
    astronomical_reasoning: str
    scientific_limitations: List[str]


class ModelEvaluationMetrics(BaseModel):
    model_name: str
    feature_configuration: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]]  # [[TN, FP], [FN, TP]]
    class_distribution: Dict[str, int]
    group_split_strategy: str = "GroupKFold by TIC ID (Star-level host isolation)"
    feature_importances: List[FeatureImportanceItem]
    training_sample_count: int
    test_sample_count: int


class ModelIntelligenceResponse(BaseModel):
    models: List[ModelEvaluationMetrics]
    experimental_conclusion: str
    does_lightcurve_improve: bool
    insight_analysis: str


class FullAnalysisReport(BaseModel):
    analysis_id: str
    timestamp: str
    target: TargetCatalogItem
    light_curves: LightCurveSet
    features: SignalFeatures
    prediction_combined: ClassificationPrediction
    prediction_catalog: ClassificationPrediction
    prediction_lightcurve: ClassificationPrediction
    data_quality_flags: List[str]
    scientific_disclaimer: str

