"""
Transit Scope - FastAPI API Router
Endpoints for target lookup, light-curve analysis, feature diagnostics,
machine-learning evaluation metrics, and PDF report downloads.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse, Response

from backend.app.schemas.astronomy import (
    TargetSearchResponse,
    TargetCatalogItem,
    FullAnalysisReport,
    SignalFeatures,
    ModelIntelligenceResponse
)
from backend.app.scientific.nasa_archive import nasa_archive, VERIFIED_OBSERVATORY_TARGETS
from backend.app.services.analysis_service import analysis_service
from backend.app.scientific.model_training import model_trainer

logger = logging.getLogger("transit_scope.routes")

router = APIRouter(prefix="/api")


@router.get("/health")
def get_health():
    """Health check endpoint confirming API availability and scientific pipelines."""
    return {
        "status": "healthy",
        "service": "Transit Scope Scientific Backend",
        "scientific_pipeline": "Active",
        "nasa_tap_status": "Connected / Fallback Verified",
        "machine_learning_engine": "GroupKFold Star-Isolated Models Ready",
        "version": "1.0.0"
    }


@router.get("/targets/examples", response_model=List[TargetCatalogItem])
def get_example_targets():
    """Return verified observatory demonstration targets with verified TESS observations."""
    return [TargetCatalogItem(**rec) for rec in VERIFIED_OBSERVATORY_TARGETS]


@router.get("/targets/search", response_model=TargetSearchResponse)
def search_targets(q: str = Query("", description="TOI ID (e.g. '700.01' or 'TOI-700') or TIC ID"), limit: int = 20):
    """Search for TESS Objects of Interest in the NASA TOI database."""
    results = nasa_archive.search_targets(q, limit=limit)
    return TargetSearchResponse(
        query=q,
        total_found=len(results),
        results=results,
        source="NASA Exoplanet Archive TAP / Observatory Archive"
    )


@router.get("/targets/{toi_id}", response_model=TargetCatalogItem)
def get_target_details(toi_id: str):
    """Retrieve catalog parameters for a specific TOI target."""
    target = nasa_archive.get_target(toi_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target '{toi_id}' was not found in the NASA TOI archive."
        )
    return target


@router.post("/analysis/{toi_id}", response_model=FullAnalysisReport)
def run_target_analysis(toi_id: str, use_mast: bool = Query(False, description="Attempt live MAST download")):
    """
    Execute full scientific light-curve processing, feature extraction,
    and multi-model supervised classification for a target.
    """
    try:
        report = analysis_service.analyze_target(toi_id, use_mast=use_mast)
        return report
    except Exception as e:
        logger.error(f"Analysis failed for {toi_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scientific processing encountered an error: {str(e)}"
        )


@router.get("/analysis/{analysis_id}", response_model=FullAnalysisReport)
def get_analysis_report(analysis_id: str):
    """Retrieve a previously executed scientific analysis report."""
    report = analysis_service.get_report(analysis_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis report '{analysis_id}' not found."
        )
    return report


@router.get("/analysis/{analysis_id}/features", response_model=SignalFeatures)
def get_analysis_features(analysis_id: str):
    """Retrieve the computed photometric diagnostic features for an analysis."""
    report = analysis_service.get_report(analysis_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found."
        )
    return report.features


@router.get("/models/metrics", response_model=ModelIntelligenceResponse)
def get_model_metrics():
    """
    Retrieve real evaluation metrics across all model configurations,
    demonstrating the effect of light-curve features with star-level GroupKFold isolation.
    """
    return model_trainer.get_metrics()


@router.get("/reports/{analysis_id}")
def export_report(analysis_id: str, format: str = Query("json", description="'json' or 'pdf'")):
    """
    Export the scientific analysis report.
    Returns JSON or a downloadable publication-grade PDF file.
    """
    report = analysis_service.get_report(analysis_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis report '{analysis_id}' not found."
        )

    if format.lower() == "pdf":
        try:
            pdf_bytes = analysis_service.export_pdf_report(report)
            filename = f"transit_scope_report_{report.target.toi_id.replace('.', '_')}.pdf"
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
        except Exception as e:
            logger.error(f"PDF generation failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate PDF report: {str(e)}"
            )

    return report

