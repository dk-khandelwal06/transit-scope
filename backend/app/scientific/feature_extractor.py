"""
Transit Scope - Scientific Feature Extractor
Extracts quantitative transit diagnostic features from processed TESS light curves.
Implements the 6 core required features plus diagnostic metrics:
1. Transit Depth (ppm)
2. Transit Duration (hours)
3. Signal-to-Noise Ratio (SNR)
4. Odd/Even Transit Depth Difference (ppm)
5. Secondary Eclipse Depth (ppm at phase 0.5)
6. In-Transit Scatter
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from backend.app.schemas.astronomy import SignalFeatures

logger = logging.getLogger("transit_scope.feature_extractor")


class FeatureExtractor:
    """Extracts astrophysically meaningful features from cleaned, flattened, and folded light curves."""

    def extract_features(
        self,
        toi_id: str,
        tic_id: str,
        period_days: float,
        catalog_duration_hours: float,
        catalog_depth_ppm: float,
        cleaned_time: np.ndarray,
        flattened_flux: np.ndarray,
        epoch_bjd: float = 1325.0
    ) -> SignalFeatures:
        """
        Calculate empirical features directly from the photometric time series.
        Validates measurements against physical bounds and flags anomalies.
        """
        warnings: List[str] = []
        n_points = len(cleaned_time)

        if n_points < 30:
            warnings.append("Insufficient cadences for high-precision photometric signal extraction.")

        # Compute phase: normalized to [-0.5, 0.5]
        phase = ((cleaned_time - epoch_bjd) % period_days) / period_days
        phase = np.where(phase > 0.5, phase - 1.0, phase)

        # Expected transit duration in phase units
        expected_dur_phase = (catalog_duration_hours / 24.0) / period_days
        half_dur_phase = expected_dur_phase / 2.0

        # Define in-transit vs out-of-transit masks
        in_transit_mask = np.abs(phase) <= half_dur_phase
        out_of_transit_mask = (np.abs(phase) > (half_dur_phase * 1.5)) & (np.abs(phase) < 0.40)
        secondary_eclipse_mask = (np.abs(phase) >= 0.45) & (np.abs(phase) <= 0.50)

        n_in_transit = int(np.sum(in_transit_mask))
        n_out = int(np.sum(out_of_transit_mask))

        # 1. Baseline and out-of-transit scatter
        if n_out > 10:
            out_flux = flattened_flux[out_of_transit_mask]
            baseline_flux = float(np.median(out_flux))
            out_scatter = float(np.std(out_flux))
        else:
            baseline_flux = 1.0
            out_scatter = float(np.std(flattened_flux))
            warnings.append("Limited out-of-transit baseline coverage; scatter estimated from global data.")

        out_scatter = max(out_scatter, 1e-6)

        # 2. Transit Depth Calculation
        if n_in_transit >= 3:
            in_flux = flattened_flux[in_transit_mask]
            # Use 15th percentile or robust mean of lowest points to avoid single noise dips
            measured_dip_fraction = max(0.0, baseline_flux - float(np.percentile(in_flux, 20)))
            calc_depth_ppm = measured_dip_fraction * 1e6
        else:
            calc_depth_ppm = float(catalog_depth_ppm)
            warnings.append("Low in-transit cadence count; transit depth anchored to catalog measurement.")

        # 3. Transit Duration Calculation
        # Determine empirical width where flux drops below baseline - 1.5 * sigma
        threshold = baseline_flux - 1.5 * (out_scatter / np.sqrt(max(1, n_in_transit // 10)))
        dip_points = phase[flattened_flux < threshold]
        if len(dip_points) >= 4 and np.any(np.abs(dip_points) < (half_dur_phase * 2.5)):
            central_dip_points = dip_points[np.abs(dip_points) < (half_dur_phase * 2.5)]
            if len(central_dip_points) >= 2:
                emp_dur_phase = float(np.max(central_dip_points) - np.min(central_dip_points))
                calc_duration_hours = emp_dur_phase * period_days * 24.0
            else:
                calc_duration_hours = float(catalog_duration_hours)
        else:
            calc_duration_hours = float(catalog_duration_hours)

        # 4. Signal-to-Noise Ratio (SNR)
        # Standard transit SNR formula: depth / (scatter / sqrt(N_in_transit))
        if n_in_transit > 0:
            snr = float((calc_depth_ppm * 1e-6) / (out_scatter / np.sqrt(n_in_transit)))
        else:
            snr = 0.0
            warnings.append("Could not calculate SNR: zero cadences located inside the transit window.")

        # 5. Odd vs Even Transit Depth Difference (Crucial Eclipsing Binary Test)
        # Assign transit cycle index: cycle = round((time - epoch) / period)
        cycle_numbers = np.round((cleaned_time - epoch_bjd) / period_days).astype(int)
        odd_cycles_mask = in_transit_mask & (cycle_numbers % 2 != 0)
        even_cycles_mask = in_transit_mask & (cycle_numbers % 2 == 0)

        odd_count = int(np.sum(odd_cycles_mask))
        even_count = int(np.sum(even_cycles_mask))

        if odd_count >= 2 and even_count >= 2:
            odd_dip = max(0.0, baseline_flux - float(np.median(flattened_flux[odd_cycles_mask]))) * 1e6
            even_dip = max(0.0, baseline_flux - float(np.median(flattened_flux[even_cycles_mask]))) * 1e6
            odd_even_diff_ppm = float(abs(odd_dip - even_dip))
        else:
            # If only one transit was observed or odd/even is unresolvable
            odd_dip = calc_depth_ppm
            even_dip = calc_depth_ppm
            odd_even_diff_ppm = 0.0
            warnings.append("Single transit or limited cycle coverage; odd/even depth difference is unconstrained.")

        # 6. Secondary Eclipse Depth (Anti-phase / phase 0.5)
        # Planetary transits produce negligible secondary eclipses in optical/TESS bands (< 50 ppm)
        # Eclipsing binaries frequently show deep secondary eclipses (hundreds or thousands of ppm)
        n_sec = int(np.sum(secondary_eclipse_mask))
        if n_sec >= 4:
            sec_flux = flattened_flux[secondary_eclipse_mask]
            sec_dip_fraction = max(0.0, baseline_flux - float(np.median(sec_flux)))
            secondary_depth_ppm = float(sec_dip_fraction * 1e6)
            sec_snr = float(sec_dip_fraction / (out_scatter / np.sqrt(n_sec)))
        else:
            secondary_depth_ppm = 0.0
            sec_snr = 0.0
            warnings.append("Secondary eclipse phase (0.5) lacks adequate observational cadences.")

        # 7. In-Transit Scatter
        if n_in_transit >= 4:
            in_transit_scatter = float(np.std(flattened_flux[in_transit_mask]))
        else:
            in_transit_scatter = out_scatter

        # 8. Transit Asymmetry (Ingress vs Egress slope)
        ingress_mask = in_transit_mask & (phase < 0)
        egress_mask = in_transit_mask & (phase > 0)
        if np.sum(ingress_mask) > 2 and np.sum(egress_mask) > 2:
            ingress_mean = float(np.mean(flattened_flux[ingress_mask]))
            egress_mean = float(np.mean(flattened_flux[egress_mask]))
            transit_asymmetry = float(abs(ingress_mean - egress_mean) * 1e6)
        else:
            transit_asymmetry = 0.0

        # Scientific explanations for each feature
        explanations = {
            "transit_depth_ppm": "Fractional drop in stellar flux during transit (in parts per million). Genuine planets typically produce dips from 100 to 10,000 ppm; dips exceeding 20,000 ppm usually indicate an eclipsing binary star.",
            "transit_duration_hours": "Time elapsed between first and fourth contact (ingress to egress). Combined with orbital period, duration constrains the stellar density and orbital inclination.",
            "signal_to_noise": "Statistical significance of the transit signal relative to stellar and instrumental noise. SNR > 7.1 is the standard TESS threshold for a reliable transit detection.",
            "odd_even_depth_diff_ppm": "Difference in depth between consecutive transits. A significant depth difference is a definitive hallmark of an eclipsing binary with alternating primary and secondary stellar occultations.",
            "secondary_eclipse_depth_ppm": "Depth measured at phase 0.5 (anti-phase). Planets emit virtually no optical light compared to their stars, so a detectable secondary eclipse (>150 ppm) strongly indicates an eclipsing companion star.",
            "in_transit_scatter": "Residual scatter of photometric measurements inside the transit. High in-transit scatter can indicate stellar flare activity, starspot crossing, or blended background contaminants."
        }

        return SignalFeatures(
            toi_id=toi_id,
            tic_id=tic_id,
            transit_depth_ppm=round(calc_depth_ppm, 2),
            transit_duration_hours=round(calc_duration_hours, 2),
            signal_to_noise=round(snr, 2),
            odd_even_depth_diff_ppm=round(odd_even_diff_ppm, 2),
            secondary_eclipse_depth_ppm=round(secondary_depth_ppm, 2),
            in_transit_scatter=round(in_transit_scatter, 6),
            out_of_transit_scatter=round(out_scatter, 6),
            odd_depth_ppm=round(odd_dip, 2),
            even_depth_ppm=round(even_dip, 2),
            secondary_snr=round(sec_snr, 2),
            transit_asymmetry=round(transit_asymmetry, 2),
            in_transit_point_count=n_in_transit,
            is_valid=len(warnings) == 0 or (snr > 3.0),
            calculation_warnings=warnings,
            explanations=explanations
        )


# Singleton feature extractor
feature_extractor = FeatureExtractor()

