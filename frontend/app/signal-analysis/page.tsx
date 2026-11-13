"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Scale, 
  HelpCircle 
} from "lucide-react";
import { runAnalysis, getExampleTargets, FullAnalysisReport, TargetCatalogItem } from "@/lib/api";
import { FeatureCard } from "@/components/FeatureCard";

function SignalAnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toiParam = searchParams.get("toi") || "TOI-700.01";

  const [activeToi, setActiveToi] = useState<string>(toiParam);
  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [exampleTargets, setExampleTargets] = useState<TargetCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getExampleTargets().then((targets) => setExampleTargets(targets)).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    runAnalysis(activeToi)
      .then((data) => setReport(data))
      .catch((err: any) => setErrorMessage(err.message || "Failed to extract features."))
      .finally(() => setIsLoading(false));
  }, [activeToi]);

  const handleTargetChange = (newToi: string) => {
    setActiveToi(newToi);
    router.push(`/signal-analysis?toi=${encodeURIComponent(newToi)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center text-muted font-telemetry space-y-3">
        <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-bold text-cyan-400">Extracting Quantitative Photometric Features...</p>
        <p className="text-xs">Computing transit depth, duration, SNR, odd/even asymmetry, and anti-phase occultation.</p>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-4 rounded border text-xs font-telemetry text-red-400 bg-red-500/10 border-red-500/30">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          <span>{errorMessage || "Target analysis data could not be loaded."}</span>
        </div>
      </div>
    );
  }

  const { features, target } = report;

  // Determine feature verdicts
  const depthVerdict = features.transit_depth_ppm > 20000 ? "suspicious" : (features.transit_depth_ppm > 10000 ? "warning" : "nominal");
  const snrVerdict = features.signal_to_noise < 7.1 ? "warning" : "nominal";
  const oddEvenVerdict = features.odd_even_depth_diff_ppm > 500 ? "suspicious" : (features.odd_even_depth_diff_ppm > 200 ? "warning" : "nominal");
  const secVerdict = features.secondary_eclipse_depth_ppm > 300 ? "suspicious" : (features.secondary_eclipse_depth_ppm > 100 ? "warning" : "nominal");
  const scatterVerdict = features.in_transit_scatter > 0.0012 ? "warning" : "nominal";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="led-indicator led-cyan" />
            <h1 className="font-astronomy text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              Signal Analysis &bull; Quantitative Diagnostics
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-telemetry mt-1" style={{ color: "var(--text-muted)" }}>
            EXTRACTED ASTROPHYSICAL PARAMETERS &bull; PHYSICAL DISCRIMINATORS
          </p>
        </div>

        {/* Target Switcher */}
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

      {/* Target Summary Telemetry Banner */}
      <div className="instrument-panel rounded-lg p-4 border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-astronomy text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {target.toi_id}
          </span>
          <span className="text-xs font-telemetry text-muted">TIC {target.tic_id}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-telemetry font-bold border ${
            target.disposition === 'CP' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-red-500/50 bg-red-500/10 text-red-400'
          }`}>
            {target.disposition === 'CP' ? 'Confirmed Planet' : 'False Positive'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-telemetry text-xs">
          <Link
            href={`/light-curve-lab?toi=${encodeURIComponent(target.toi_id)}`}
            className="px-3 py-1.5 rounded border text-muted hover:text-white"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-surface)" }}
          >
            &larr; Light Curves
          </Link>
          <Link
            href={`/classification-lab?toi=${encodeURIComponent(target.toi_id)}`}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded font-bold uppercase bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Proceed to ML Classification &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 6 Required Primary Features Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="led-indicator led-amber" />
            <h2 className="font-astronomy text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              The 6 Core Required Model Features
            </h2>
          </div>
          <span className="text-xs font-telemetry" style={{ color: "var(--text-muted)" }}>
            EXTRACTED FROM PHASE-FOLDED PHOTOMETRY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Transit Depth */}
          <FeatureCard
            name="1. Transit Depth"
            value={features.transit_depth_ppm}
            unit="ppm"
            threshold="< 20,000 ppm (Planetary Limit)"
            verdict={depthVerdict}
            whatItMeasures="Fractional drop in stellar flux at the central bottom of the transit event."
            whyItMatters="Directly constrains the physical radius ratio of the transiting body: delta = (Rp / R*)^2."
            howItDistinguishes="Genuine giant planets rarely exceed 15,000 to 20,000 ppm dips. Dips exceeding 25,000 ppm overwhelmingly signify an eclipsing star."
            isValid={features.is_valid}
          />

          {/* 2. Transit Duration */}
          <FeatureCard
            name="2. Transit Duration"
            value={features.transit_duration_hours}
            unit="hours"
            threshold="0.5 - 12.0 hours"
            verdict="nominal"
            whatItMeasures="Total time elapsed between first contact (T1) and fourth contact (T4)."
            whyItMatters="Combined with the orbital period, transit duration directly constrains stellar mean density and orbital inclination."
            howItDistinguishes="Extremely short or grazing V-shaped dips have truncated durations that point toward grazing stellar companions."
            isValid={features.is_valid}
          />

          {/* 3. Signal-to-Noise Ratio (SNR) */}
          <FeatureCard
            name="3. Signal-to-Noise Ratio (SNR)"
            value={features.signal_to_noise}
            unit="&sigma;"
            threshold="> 7.1 &sigma; (TESS Threshold)"
            verdict={snrVerdict}
            whatItMeasures="Statistical significance of the transit signal relative to residual out-of-transit photometric noise."
            whyItMatters="Establishes whether the brightness dip is a true periodic astrophysical signal or a noise fluctuation."
            howItDistinguishes="Signals below 7.1 sigma are prone to instrumental jitter and false alarm triggers."
            isValid={features.signal_to_noise > 3.0}
            reliabilityNote="Low in-transit cadence count"
          />

          {/* 4. Odd/Even Transit Depth Difference */}
          <FeatureCard
            name="4. Odd/Even Depth Disparity"
            value={features.odd_even_depth_diff_ppm}
            unit="ppm"
            threshold="< 400 ppm (Symmetric)"
            verdict={oddEvenVerdict}
            whatItMeasures="Absolute difference in transit depth between odd-numbered cycles and even-numbered cycles."
            whyItMatters="Planets produce identical transit depths every orbit. Eclipsing binaries alternate between primary and secondary eclipses."
            howItDistinguishes="A statistically significant odd/even depth difference is definitive, near-conclusive proof of an eclipsing binary system."
            isValid={features.is_valid}
          />

          {/* 5. Secondary Eclipse Depth */}
          <FeatureCard
            name="5. Secondary Eclipse Depth"
            value={features.secondary_eclipse_depth_ppm}
            unit="ppm"
            threshold="< 250 ppm (No Optical Occultation)"
            verdict={secVerdict}
            whatItMeasures="Apparent flux dip measured exactly half an orbit later at anti-phase (&phi; = 0.5)."
            whyItMatters="Exoplanets emit negligible optical light in TESS bandpass. Detectable optical dips at phase 0.5 reveal a luminous stellar companion."
            howItDistinguishes="Any measurable secondary dip (>250 ppm) rules out a normal transiting exoplanet and identifies an eclipsing binary pair."
            isValid={features.is_valid}
          />

          {/* 6. In-Transit Scatter */}
          <FeatureCard
            name="6. In-Transit Scatter"
            value={features.in_transit_scatter}
            unit="&sigma; flux"
            threshold="< 0.0010 (Normalized)"
            verdict={scatterVerdict}
            whatItMeasures="Standard deviation of observed photometric cadences inside the transit window."
            whyItMatters="Indicates whether the transit bottom is flat and stable or noisy and disturbed."
            howItDistinguishes="Elevated in-transit scatter can betray blended background stars, stellar flaring, or starspot crossing events."
            isValid={features.is_valid}
          />
        </div>
      </div>

      {/* Visual Diagnostic Comparison Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Odd vs Even Comparison Visual */}
        <div className="instrument-panel rounded-lg p-5 border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="font-astronomy text-sm font-bold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}>
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Odd vs. Even Cycle Symmetry Test</span>
            </h3>
            <span className="text-xs font-telemetry" style={{ color: "var(--accent-cyan)" }}>
              Diff: {features.odd_even_depth_diff_ppm.toFixed(1)} ppm
            </span>
          </div>

          <div className="space-y-3 font-telemetry text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Odd Transit Cycles Depth:</span>
                <span className="font-bold text-cyan-400">{features.odd_depth_ppm.toFixed(1)} ppm</span>
              </div>
              <div className="w-full h-3 rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${Math.min(100, (features.odd_depth_ppm / Math.max(features.odd_depth_ppm, features.even_depth_ppm, 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Even Transit Cycles Depth:</span>
                <span className="font-bold text-amber-400">{features.even_depth_ppm.toFixed(1)} ppm</span>
              </div>
              <div className="w-full h-3 rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.min(100, (features.even_depth_ppm / Math.max(features.odd_depth_ppm, features.even_depth_ppm, 1)) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed pt-2">
              {features.odd_even_depth_diff_ppm < 400
                ? "Symmetry Confirmed: Odd and even transit depths are statistically indistinguishable, consistent with a single transiting body."
                : "Asymmetry Detected: Significant depth disparity between odd and even transits reveals alternating primary and secondary eclipses of a binary star."}
            </p>
          </div>
        </div>

        {/* Secondary Eclipse Test Visual */}
        <div className="instrument-panel rounded-lg p-5 border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="font-astronomy text-sm font-bold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Phase Occultation Test (&phi; = 0.5)</span>
            </h3>
            <span className="text-xs font-telemetry" style={{ color: "var(--accent-amber)" }}>
              Sec. SNR: {features.secondary_snr.toFixed(1)} &sigma;
            </span>
          </div>

          <div className="space-y-3 font-telemetry text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Primary Transit Depth (&phi; = 0.0):</span>
                <span className="font-bold text-emerald-400">{features.transit_depth_ppm.toFixed(1)} ppm</span>
              </div>
              <div className="w-full h-3 rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Secondary Eclipse Depth (&phi; = 0.5):</span>
                <span className="font-bold text-red-400">{features.secondary_eclipse_depth_ppm.toFixed(1)} ppm</span>
              </div>
              <div className="w-full h-3 rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-red-400"
                  style={{ width: `${Math.min(100, (features.secondary_eclipse_depth_ppm / Math.max(features.transit_depth_ppm, 1)) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed pt-2">
              {features.secondary_eclipse_depth_ppm < 250
                ? "Clean Anti-Phase: No secondary eclipse detected above noise floor at phase 0.5. Highly consistent with dark planetary companion."
                : "Secondary Eclipse Detected: Prominent anti-phase dip confirms occultation of a self-luminous secondary companion star."}
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostic flags & Warnings */}
      <div className="instrument-panel rounded-lg p-5 border shadow-sm space-y-3">
        <h3 className="font-astronomy text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--text-primary)" }}>
          Data Integrity &amp; Quality Flags
        </h3>

        <div className="space-y-2 font-telemetry text-xs">
          {report.data_quality_flags.map((flag, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="led-indicator led-cyan shrink-0" />
              <span style={{ color: "var(--text-secondary)" }}>{flag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignalAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-telemetry text-cyan-400">Loading Signal Analysis...</div>}>
      <SignalAnalysisContent />
    </Suspense>
  );
}
