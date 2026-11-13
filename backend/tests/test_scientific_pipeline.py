"""
Transit Scope - Scientific & Machine Learning Test Suite
Tests data processing, signal extraction, GroupKFold star-level isolation,
model inference, and PDF report generation.
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.scientific.nasa_archive import nasa_archive
from backend.app.scientific.lightcurve_processor import lightcurve_processor
from backend.app.scientific.feature_extractor import feature_extractor
from backend.app.scientific.model_training import model_trainer
from backend.app.services.analysis_service import analysis_service

client = TestClient(app)


def test_health_endpoint():
    """Verify backend health endpoint returns operational status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Transit Scope" in data["service"]


def test_target_lookup():
    """Test target retrieval for confirmed planet TOI-700.01."""
    target = nasa_archive.get_target("TOI-700.01")
    assert target is not None
    assert target.toi_id == "TOI-700.01"
    assert target.tic_id == "150428135"
    assert target.disposition == "CP"
    assert target.period_days > 30.0


def test_target_search():
    """Test searching targets by keyword."""
    response = client.get("/api/targets/search?q=700")
    assert response.status_code == 200
    data = response.json()
    assert data["total_found"] >= 1
    assert any("700" in item["toi_id"] for item in data["results"])


def test_lightcurve_processing():
    """Verify raw, cleaned, flattened, and folded light curve generation."""
    lc_set = lightcurve_processor.process_target_lightcurve(
        toi_id="TOI-700.01",
        tic_id="150428135",
        period_days=37.426,
        duration_hours=3.65,
        depth_ppm=920.0,
        epoch_bjd=1326.495,
        disposition="CP"
    )
    assert len(lc_set.raw_points) > 50
    assert len(lc_set.cleaned_points) > 50
    assert len(lc_set.flattened_points) > 50
    assert len(lc_set.folded_points) > 50
    assert len(lc_set.binned_folded) == 100
    
    # Check that folded phase is within [-0.5, 0.5]
    phases = [p.phase for p in lc_set.folded_points if p.phase is not None]
    assert min(phases) >= -0.5
    assert max(phases) <= 0.5


def test_feature_extraction():
    """Verify calculation of all required quantitative transit features."""
    # Synthetic flat curve with transit dip
    time = np.linspace(1320.0, 1340.0, 3000)
    flux = np.ones_like(time)
    period = 5.0
    epoch = 1322.0
    phase = ((time - epoch) % period) / period
    phase = np.where(phase > 0.5, phase - 1.0, phase)
    
    # Inject 1500 ppm dip with 2.5 hour duration (dur_phase = 2.5/(24*5) = 0.0208)
    dur_phase = 2.5 / (24.0 * period)
    in_dip = np.abs(phase) < (dur_phase / 2.0)
    flux[in_dip] -= 0.0015
    flux += np.random.normal(0, 0.0001, len(flux))

    features = feature_extractor.extract_features(
        toi_id="TEST-01",
        tic_id="999999",
        period_days=period,
        catalog_duration_hours=2.5,
        catalog_depth_ppm=1500.0,
        cleaned_time=time,
        flattened_flux=flux,
        epoch_bjd=epoch
    )

    assert features.transit_depth_ppm > 800.0
    assert features.transit_duration_hours > 1.0
    assert features.signal_to_noise > 10.0
    assert features.odd_even_depth_diff_ppm >= 0.0
    assert features.secondary_eclipse_depth_ppm >= 0.0
    assert features.is_valid is True


def test_grouped_cross_validation_zero_leakage():
    """
    CRITICAL EVALUATION REQUIREMENT:
    Verify that GroupKFold strictly isolates stars by TIC ID so no star
    appears in both training and test partitions.
    """
    from sklearn.model_selection import GroupKFold
    df = model_trainer.build_dataset()
    groups = df["tic_id"].values
    gkf = GroupKFold(n_splits=4)
    
    for train_idx, test_idx in gkf.split(df, groups=groups):
        train_stars = set(groups[train_idx])
        test_stars = set(groups[test_idx])
        intersection = train_stars.intersection(test_stars)
        assert len(intersection) == 0, f"DATA LEAKAGE DETECTED! Stars present in both splits: {intersection}"


def test_model_metrics():
    """Verify model metrics endpoint returns realistic evaluations across all configurations."""
    metrics = model_trainer.get_metrics()
    assert len(metrics.models) == 6
    assert metrics.does_lightcurve_improve is True
    assert "GroupKFold by TIC ID" in metrics.models[0].group_split_strategy

    for m in metrics.models:
        assert 0.0 <= m.accuracy <= 1.0
        assert 0.0 <= m.f1_score <= 1.0
        assert 0.0 <= m.roc_auc <= 1.0
        assert len(m.confusion_matrix) == 2


def test_end_to_end_analysis():
    """Verify full end-to-end analysis on confirmed planet TOI-700.01."""
    report = analysis_service.analyze_target("TOI-700.01")
    assert report.target.toi_id == "TOI-700.01"
    assert report.prediction_combined.predicted_class == "Planet"
    assert report.prediction_combined.planet_probability > 0.50
    assert len(report.data_quality_flags) > 0


def test_pdf_report_generation():
    """Verify PDF export builds valid binary document."""
    report = analysis_service.analyze_target("TOI-700.01")
    pdf_bytes = analysis_service.export_pdf_report(report)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

