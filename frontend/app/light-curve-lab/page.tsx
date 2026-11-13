"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Activity, 
  Layers, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Cpu,
  FileText
} from "lucide-react";
import { 
  runAnalysis, 
  getExampleTargets, 
  FullAnalysisReport, 
  TargetCatalogItem 
} from "@/lib/api";
import { ScientificChart } from "@/components/ScientificChart";

function LightCurveLabContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toiParam = searchParams.get("toi") || "TOI-700.01";

  const [activeToi, setActiveToi] = useState<string>(toiParam);
  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [exampleTargets, setExampleTargets] = useState<TargetCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "raw" | "cleaned" | "flattened" | "folded">("all");

  // Load example targets list for dropdown
  useEffect(() => {
    getExampleTargets().then((targets) => setExampleTargets(targets)).catch(() => {});
  }, []);

  // Fetch or execute analysis for active target
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    runAnalysis(activeToi)
      .then((data) => {
        setReport(data);
      })
      .catch((err: any) => {
        setErrorMessage(err.message || "Failed to process light curve.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeToi]);

  const handleTargetChange = (newToi: string) => {
    setActiveToi(newToi);
    router.push(`/light-curve-lab?toi=${encodeURIComponent(newToi)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header and Target Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="led-indicator led-cyan" />
            <h1 className="font-astronomy text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              Light Curve Lab &bull; Photometric Signal Processing
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-telemetry mt-1" style={{ color: "var(--text-muted)" }}>
            RAW PHOTOMETRY &rarr; QUALITY CLEANING &rarr; DETRENDING &rarr; PHASE FOLDING
          </p>
        </div>

        {/* Target selector */}
        <div className="flex items-center gap-2 font-telemetry text-xs">
          <span className="text-muted">Target:</span>
          <select
            value={activeToi}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="px-3 py-1.5 rounded border outline-none font-bold text-cyan-400 font-telemetry cursor-pointer"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
          >
            {exampleTargets.map((t) => (
              <option key={t.toi_id} value={t.toi_id}>
                {t.toi_id} ({t.disposition === 'CP' ? 'Planet' : 'False Positive'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Telemetry Banner */}
      {report && (
        <div className="instrument-panel rounded-lg p-4 border shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-astronomy text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {report.target.toi_id}
              </span>
              <span className="text-xs font-telemetry text-muted ml-2">TIC {report.target.tic_id}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-telemetry font-bold border ${
              report.target.disposition === 'CP'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/50 bg-red-500/10 text-red-400'
            }`}>
              {report.target.disposition === 'CP' ? 'Confirmed Planet' : 'False Positive'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-telemetry text-xs">
            <div>
              <span className="text-muted block text-[10px]">Period</span>
              <span className="font-bold text-cyan-400">{report.light_curves.period_days.toFixed(4)} d</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">Depth</span>
              <span className="font-bold text-emerald-400">{report.features.transit_depth_ppm.toLocaleString()} ppm</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">Duration</span>
              <span>{report.features.transit_duration_hours.toFixed(2)} hrs</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">SNR</span>
              <span className="font-bold text-amber-400">{report.features.signal_to_noise.toFixed(1)} &sigma;</span>
            </div>
          </div>

          {/* Quick link to features */}
          <Link
            href={`/signal-analysis?toi=${encodeURIComponent(report.target.toi_id)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs uppercase font-telemetry bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all"
          >
            <span>View Extracted Features</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded border text-xs font-telemetry text-red-400 bg-red-500/10 border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* View Mode Tabs: All Stacked vs Single Focus */}
      <div className="flex items-center gap-2 border-b pb-2 text-xs font-telemetry"
        style={{ borderColor: "var(--border-subtle)" }}>
        <span className="text-muted mr-2">Display Mode:</span>
        {[
          { id: "all", label: "All 4 Processing Stages (Comparative)" },
          { id: "raw", label: "1. Raw TESS Photometry" },
          { id: "cleaned", label: "2. Cleaned Signal" },
          { id: "flattened", label: "3. Flattened / Detrended" },
          { id: "folded", label: "4. Phase-Folded Transit" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1 rounded border transition-all ${
              activeTab === tab.id ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? "var(--bg-surface-elevated)" : "transparent",
              borderColor: activeTab === tab.id ? "var(--accent-cyan)" : "var(--border-color)",
              color: activeTab === tab.id ? "var(--accent-cyan)" : "var(--text-secondary)"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="p-16 text-center text-muted font-telemetry space-y-3">
          <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-sm font-bold text-cyan-400">Processing TESS Photometric Time Series...</p>
          <p className="text-xs">Detrending stellar variability and performing phase alignment.</p>
        </div>
      ) : report ? (
        <div className="space-y-8">
          {/* 1. RAW LIGHT CURVE */}
          {(activeTab === "all" || activeTab === "raw") && (
            <ScientificChart
              title="1. Raw TESS Photometry"
              subtitle="Stellar Brightness vs Observation Time"
              description="Displays calibrated 2-minute cadence relative stellar flux as observed by the TESS camera across full observing sectors. Notice slow sinusoidal modulation caused by starspot rotation and instrumental thermal baseline drift."
              dataPoints={report.light_curves.raw_points.map((p) => ({ x: p.time, y: p.flux }))}
              xAxisLabel="Observation Time (BJD - 2457000)"
              yAxisLabel="Raw Relative Flux"
              chartType="raw"
            />
          )}

          {/* 2. CLEANED LIGHT CURVE */}
          {(activeTab === "all" || activeTab === "cleaned") && (
            <ScientificChart
              title="2. Cleaned Light Curve"
              subtitle="Cosmic Ray Spikes & Non-Finite Cadences Masked"
              description="Eliminates corrupted cadences, invalid zero values, and spurious positive flux spikes caused by charged cosmic ray impacts on the CCD using an asymmetric 5-sigma upper envelope clip while preserving all downward transit dips."
              dataPoints={report.light_curves.cleaned_points.map((p) => ({ x: p.time, y: p.flux }))}
              xAxisLabel="Observation Time (BJD - 2457000)"
              yAxisLabel="Cleaned Flux"
              chartType="cleaned"
            />
          )}

          {/* 3. FLATTENED / DETRENDED LIGHT CURVE */}
          {(activeTab === "all" || activeTab === "flattened") && (
            <ScientificChart
              title="3. Flattened / Detrended Light Curve"
              subtitle="Stellar Variability Removed (Window = 4x Transit Duration)"
              description="Long-term astrophysical starspot variability and spacecraft momentum dump trends are normalized out using a transit-preserving Savitzky-Golay running median filter. The baseline is leveled to exactly 1.000 while preserving genuine transit dip depth."
              dataPoints={report.light_curves.flattened_points.map((p) => ({ x: p.time, y: p.flux }))}
              xAxisLabel="Observation Time (BJD - 2457000)"
              yAxisLabel="Normalized Flux (Baseline 1.000)"
              chartType="flattened"
            />
          )}

          {/* 4. PHASE-FOLDED TRANSIT PROFILE */}
          {(activeTab === "all" || activeTab === "folded") && (
            <ScientificChart
              title="4. Phase-Folded Transit Profile"
              subtitle={`Folded by Orbital Period P = ${report.light_curves.period_days.toFixed(4)} days`}
              description="All recurring transits across all observing sectors are folded modulo the orbital period, aligning every transit dip at phase 0.0. Phase binning into 100 bins with empirical transit fit overlay boosts statistical signal-to-noise ratio."
              dataPoints={report.light_curves.folded_points.map((p) => ({
                x: p.phase !== undefined && p.phase !== null ? p.phase : 0,
                y: p.flux
              }))}
              binnedPoints={report.light_curves.binned_folded}
              xAxisLabel="Orbital Phase (&phi;) [Centered at 0.0]"
              yAxisLabel="Normalized Relative Flux"
              chartType="folded"
            />
          )}

          {/* Detailed Scientific Step-by-Step Educational Explanation */}
          <div className="instrument-panel rounded-lg p-6 border shadow-md space-y-4">
            <h3 className="font-astronomy text-lg font-bold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}>
              <Info className="w-5 h-5 text-cyan-400" />
              <span>Scientific Processing Insights: The Transformation Chain</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-telemetry">
              <div className="p-3 rounded border space-y-1"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <span className="font-bold text-cyan-400 block">Phase 1: Raw Flux</span>
                <p className="text-muted leading-relaxed">
                  Stellar time series contaminated by rotational spot modulation and orbital momentum dumps. Transits are barely discernible to the eye.
                </p>
              </div>

              <div className="p-3 rounded border space-y-1"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <span className="font-bold text-cyan-400 block">Phase 2: Cleaning</span>
                <p className="text-muted leading-relaxed">
                  Asymmetric 5&sigma; upper clip removes charged particle cosmic ray strikes without clipping negative transit points.
                </p>
              </div>

              <div className="p-3 rounded border space-y-1"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <span className="font-bold text-blue-400 block">Phase 3: Detrending</span>
                <p className="text-muted leading-relaxed">
                  Savitzky-Golay running median normalizes baseline to 1.000. Window is calibrated to 4x transit duration so dips are never erased.
                </p>
              </div>

              <div className="p-3 rounded border space-y-1"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <span className="font-bold text-amber-400 block">Phase 4: Phase Folding</span>
                <p className="text-muted leading-relaxed">
                  Folds time modulo period P. Stacking all transits together increases SNR by &radic;N, revealing clear U-shape or V-shape profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LightCurveLabPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-telemetry text-cyan-400">Loading Light Curve Lab...</div>}>
      <LightCurveLabContent />
    </Suspense>
  );
}
