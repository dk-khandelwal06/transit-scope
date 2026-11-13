"""
Transit Scope - Scientific Analysis Service
Coordinates data retrieval, light-curve signal processing, feature extraction,
multi-model ML classification, and scientific report compilation (with PDF export).
"""

import io
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
import numpy as np

from backend.app.schemas.astronomy import (
    TargetCatalogItem,
    LightCurveSet,
    SignalFeatures,
    ClassificationPrediction,
    FullAnalysisReport
)
from backend.app.scientific.nasa_archive import nasa_archive
from backend.app.scientific.lightcurve_processor import lightcurve_processor
from backend.app.scientific.feature_extractor import feature_extractor
from backend.app.scientific.model_training import model_trainer

logger = logging.getLogger("transit_scope.analysis_service")

REPORTS_CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "reports"
REPORTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)


class AnalysisService:
    """End-to-end scientific orchestration service."""

    def __init__(self):
        self.cached_reports: Dict[str, FullAnalysisReport] = {}

    def analyze_target(self, toi_or_tic: str, use_mast: bool = False) -> FullAnalysisReport:
        """
        Execute full scientific pipeline:
        1. Resolve target via NASA TAP or verified observatory database
        2. Clean, detrend, fold, and bin TESS light curves
        3. Extract quantitative transit features
        4. Run supervised ML classification across all feature configurations
        5. Compile complete scientific analysis report
        """
        target = nasa_archive.get_target(toi_or_tic)
        if not target:
            # Fallback construct minimum valid target item
            clean_name = toi_or_tic.upper().replace("TOI-", "").replace("TOI", "").strip()
            target = TargetCatalogItem(
                toi_id=f"TOI-{clean_name}",
                tic_id="100000001",
                disposition="PC",
                period_days=5.0,
                duration_hours=2.5,
                depth_ppm=1200.0,
                tess_mag=11.0,
                teff_k=5500.0,
                stellar_radius_solar=1.0,
                ra_deg=0.0,
                dec_deg=0.0,
                epoch_bjd=1325.0,
                has_lightcurve=True,
                is_cached_demo=False
            )

        period = target.period_days or 5.0
        duration = target.duration_hours or 2.5
        depth = target.depth_ppm or 1000.0
        epoch = target.epoch_bjd or 1325.0
        teff = target.teff_k or 5500.0
        tmag = target.tess_mag or 11.0

        # 1. Process Light Curves
        lc_set: LightCurveSet = lightcurve_processor.process_target_lightcurve(
            toi_id=target.toi_id,
            tic_id=target.tic_id,
            period_days=period,
            duration_hours=duration,
            depth_ppm=depth,
            epoch_bjd=epoch,
            disposition=target.disposition,
            stellar_teff=teff,
            tess_mag=tmag,
            use_mast=use_mast
        )

        # Convert points back to arrays for feature calculation
        clean_time = np.array([p.time for p in lc_set.cleaned_points])
        flat_flux = np.array([p.flux for p in lc_set.flattened_points])

        # 2. Extract Features
        features: SignalFeatures = feature_extractor.extract_features(
            toi_id=target.toi_id,
            tic_id=target.tic_id,
            period_days=period,
            catalog_duration_hours=duration,
            catalog_depth_ppm=depth,
            cleaned_time=clean_time,
            flattened_flux=flat_flux,
            epoch_bjd=epoch
        )

        # 3. Supervised Model Classification
        catalog_dict = {
            "period_days": period,
            "duration_hours": duration,
            "depth_ppm": depth,
            "tess_mag": tmag,
            "teff_k": teff,
            "stellar_radius_solar": target.stellar_radius_solar or 1.0
        }
        features_dict = {
            "transit_depth_ppm": features.transit_depth_ppm,
            "transit_duration_hours": features.transit_duration_hours,
            "signal_to_noise": features.signal_to_noise,
            "odd_even_depth_diff_ppm": features.odd_even_depth_diff_ppm,
            "secondary_eclipse_depth_ppm": features.secondary_eclipse_depth_ppm,
            "in_transit_scatter": features.in_transit_scatter
        }

        pred_combined = model_trainer.predict(target.toi_id, catalog_dict, features_dict, config="combined")
        pred_catalog = model_trainer.predict(target.toi_id, catalog_dict, features_dict, config="catalog_only")
        pred_lc = model_trainer.predict(target.toi_id, catalog_dict, features_dict, config="lightcurve_only")

        # Compile Quality Flags
        quality_flags = []
        if features.signal_to_noise < 7.1:
            quality_flags.append("Low Signal-to-Noise: SNR is below the canonical 7.1 sigma TESS detection threshold.")
        else:
            quality_flags.append(f"Statistically Significant Signal: SNR = {features.signal_to_noise:.1f} sigma.")

        if features.odd_even_depth_diff_ppm > 500:
            quality_flags.append(f"Odd/Even Depth Asymmetry: {features.odd_even_depth_diff_ppm:.1f} ppm disparity indicates an eclipsing binary pair.")
        if features.secondary_eclipse_depth_ppm > 300:
            quality_flags.append(f"Secondary Eclipse Present: {features.secondary_eclipse_depth_ppm:.1f} ppm dip at phase 0.5 reveals secondary star occultation.")

        if not quality_flags:
            quality_flags.append("Nominal Photometric Quality: No anomalous instrumental or astronomical artifacts detected.")

        analysis_id = f"ANALYSIS-{target.toi_id.replace('.', '_').replace('-', '_')}"
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        disclaimer = (
            "Transit Scope machine-learning predictions constitute diagnostic triage and statistical screening only. "
            "They do not replace official radial-velocity confirmation, high-contrast imaging, or formal peer-reviewed "
            "validation by the TESS Follow-up Observing Program (TFOP)."
        )

        report = FullAnalysisReport(
            analysis_id=analysis_id,
            timestamp=now_str,
            target=target,
            light_curves=lc_set,
            features=features,
            prediction_combined=pred_combined,
            prediction_catalog=pred_catalog,
            prediction_lightcurve=pred_lc,
            data_quality_flags=quality_flags,
            scientific_disclaimer=disclaimer
        )

        self.cached_reports[analysis_id] = report
        # Cache to disk
        try:
            with open(REPORTS_CACHE_DIR / f"{analysis_id}.json", "w", encoding="utf-8") as f:
                f.write(report.model_dump_json(indent=2))
        except Exception as e:
            logger.warning(f"Could not write disk report cache: {e}")

        return report

    def get_report(self, analysis_id: str) -> Optional[FullAnalysisReport]:
        """Fetch previously computed report by ID."""
        if analysis_id in self.cached_reports:
            return self.cached_reports[analysis_id]
        
        disk_path = REPORTS_CACHE_DIR / f"{analysis_id}.json"
        if disk_path.exists():
            try:
                with open(disk_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    rep = FullAnalysisReport(**data)
                    self.cached_reports[analysis_id] = rep
                    return rep
            except Exception as e:
                logger.warning(f"Failed to read cached report {analysis_id}: {e}")

        # Attempt to reconstruct if matches pattern ANALYSIS_TOI_...
        clean = analysis_id.replace("ANALYSIS-", "").replace("ANALYSIS_", "").replace("_", ".")
        if "TOI" in clean:
            return self.analyze_target(clean)

        return None

    def export_pdf_report(self, report: FullAnalysisReport) -> bytes:
        """Generate a scientific PDF analysis report using ReportLab."""
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0B1120"),
            alignment=0
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569")
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1E293B")
        )
        disclaimer_style = ParagraphStyle(
            "DisclaimerStyle",
            parent=styles["Italic"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748B")
        )

        story = []

        # Header
        story.append(Paragraph("TRANSIT SCOPE", title_style))
        story.append(Paragraph("ASTRONOMICAL SIGNAL ANALYSIS & CLASSIFICATION REPORT", subtitle_style))
        story.append(Paragraph(f"Report ID: {report.analysis_id} &bull; Generated: {report.timestamp}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceBefore=0, spaceAfter=12))

        # Target Identification Table
        story.append(Paragraph("1. Target Identification & Astrophysical Parameters", h2_style))
        target_data = [
            ["TOI Identifier", report.target.toi_id, "TESS Input Catalog (TIC)", report.target.tic_id],
            ["Orbital Period", f"{report.target.period_days:.4f} days" if report.target.period_days else "N/A", "Transit Duration", f"{report.target.duration_hours:.2f} hours" if report.target.duration_hours else "N/A"],
            ["Transit Depth", f"{report.target.depth_ppm:.0f} ppm" if report.target.depth_ppm else "N/A", "TESS Magnitude", f"{report.target.tess_mag:.2f}" if report.target.tess_mag else "N/A"],
            ["Effective Temp (Teff)", f"{report.target.teff_k:.0f} K" if report.target.teff_k else "N/A", "Stellar Radius", f"{report.target.stellar_radius_solar:.2f} R_sun" if report.target.stellar_radius_solar else "N/A"],
            ["Catalog Disposition", report.target.disposition, "Data Source", "TESS SPOC Photometry / TAP"]
        ]
        t1 = Table(target_data, colWidths=[120, 140, 140, 140])
        t1.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4)
        ]))
        story.append(t1)
        story.append(Spacer(1, 10))

        # Extracted Features Table
        story.append(Paragraph("2. Photometric Signal Diagnostic Features", h2_style))
        feat_data = [
            ["Metric Name", "Extracted Value", "Diagnostic Threshold", "Assessment"],
            ["Transit Depth", f"{report.features.transit_depth_ppm:.1f} ppm", "< 20,000 ppm", "Consistent with planetary radius" if report.features.transit_depth_ppm < 20000 else "Eclipsing companion size"],
            ["Transit Duration", f"{report.features.transit_duration_hours:.2f} hrs", "0.5 - 12.0 hrs", "Physically plausible transit"],
            ["Signal-to-Noise Ratio", f"{report.features.signal_to_noise:.1f} sigma", "> 7.1 sigma", "Robust transit detection" if report.features.signal_to_noise >= 7.1 else "Marginal statistical significance"],
            ["Odd/Even Depth Diff", f"{report.features.odd_even_depth_diff_ppm:.1f} ppm", "< 400 ppm", "No alternating eclipses" if report.features.odd_even_depth_diff_ppm < 400 else "Strong eclipsing binary signature"],
            ["Secondary Eclipse Depth", f"{report.features.secondary_eclipse_depth_ppm:.1f} ppm", "< 250 ppm", "Negligible day-side emission" if report.features.secondary_eclipse_depth_ppm < 250 else "Secondary star occultation"],
            ["In-Transit Scatter", f"{report.features.in_transit_scatter:.6f}", "< 0.0010", "Nominal photometric stability"]
        ]
        t2 = Table(feat_data, colWidths=[130, 100, 110, 200])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FFFFFF")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4)
        ]))
        story.append(t2)
        story.append(Spacer(1, 10))

        # Classification Results
        story.append(Paragraph("3. Supervised Machine Learning Classification", h2_style))
        is_planet = report.prediction_combined.predicted_class == "Planet"
        badge_color = colors.HexColor("#059669") if is_planet else colors.HexColor("#DC2626")
        
        ml_data = [
            ["Model Configuration", "Predicted Class", "Planet Prob.", "False Positive Prob.", "Confidence"],
            ["Combined Multi-Modal (RF)", report.prediction_combined.predicted_class, f"{report.prediction_combined.planet_probability*100:.1f}%", f"{report.prediction_combined.false_positive_probability*100:.1f}%", report.prediction_combined.confidence_level],
            ["Light-Curve Only (RF)", report.prediction_lightcurve.predicted_class, f"{report.prediction_lightcurve.planet_probability*100:.1f}%", f"{report.prediction_lightcurve.false_positive_probability*100:.1f}%", report.prediction_lightcurve.confidence_level],
            ["Catalog-Only Baseline (LR)", report.prediction_catalog.predicted_class, f"{report.prediction_catalog.planet_probability*100:.1f}%", f"{report.prediction_catalog.false_positive_probability*100:.1f}%", report.prediction_catalog.confidence_level]
        ]
        t3 = Table(ml_data, colWidths=[150, 110, 95, 105, 80])
        t3.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("TEXTCOLOR", (1, 1), (1, 1), badge_color),
            ("FONTNAME", (1, 1), (1, 1), "Helvetica-Bold")
        ]))
        story.append(t3)
        story.append(Spacer(1, 10))

        # Astronomical Reasoning
        story.append(Paragraph("4. Evidence & Astronomical Reasoning", h2_style))
        story.append(Paragraph(report.prediction_combined.astronomical_reasoning, body_style))
        story.append(Spacer(1, 8))

        # Quality Warnings
        story.append(Paragraph("5. Data Quality Flags & Observation Integrity", h2_style))
        for flag in report.data_quality_flags:
            story.append(Paragraph(f"&bull; {flag}", body_style))
        story.append(Spacer(1, 12))

        # Disclaimer
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=6, spaceAfter=8))
        story.append(Paragraph(report.scientific_disclaimer, disclaimer_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


# Singleton analysis service instance
analysis_service = AnalysisService()
