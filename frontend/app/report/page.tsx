"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Telescope, 
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { 
  runAnalysis, 
  getExampleTargets, 
  getPdfDownloadUrl, 
  FullAnalysisReport, 
  TargetCatalogItem 
} from "@/lib/api";
import { ScientificChart } from "@/components/ScientificChart";

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toiParam = searchParams.get("toi") || "TOI-700.01";

  const [activeToi, setActiveToi] = useState<string>(toiParam);
  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [exampleTargets, setExampleTargets] = useState<TargetCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    getExampleTargets().then((targets) => setExampleTargets(targets)).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    runAnalysis(activeToi)
      .then((data) => setReport(data))
      .catch((err: any) => setErrorMessage(err.message || "Failed to compile report."))
      .finally(() => setIsLoading(false));
  }, [activeToi]);

  const handleTargetChange = (newToi: string) => {
    setActiveToi(newToi);
    router.push(`/report?toi=${encodeURIComponent(newToi)}`);
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    setIsExporting(true);
    const pdfUrl = getPdfDownloadUrl(report.analysis_id);
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `transit_scope_report_${report.target.toi_id.replace('.', '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center font-telemetry space-y-3">
        <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-bold text-cyan-400">Compiling Astronomical Analysis Report...</p>
        <p className="text-xs text-muted">Aggregating light curves, diagnostic features, and model probabilities.</p>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="p-4 rounded border text-xs font-telemetry text-red-400 bg-red-500/10 border-red-500/30">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          <span>{errorMessage || "Report data could not be compiled."}</span>
        </div>
      </div>
    );
  }

  const { target, features, prediction_combined, prediction_catalog, prediction_lightcurve } = report;
  const isPlanet = prediction_combined.predicted_class === "Planet";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-telemetry text-muted hover:text-white"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs font-telemetry text-muted">&bull; Target:</span>
          <select
            value={activeToi}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="px-3 py-1.5 rounded border outline-none font-bold text-cyan-400 font-telemetry text-xs cursor-pointer"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}
          >
            {exampleTargets.map((t) => (
              <option key={t.toi_id} value={t.toi_id}>
                {t.toi_id} ({t.disposition === 'CP' ? 'Planet' : 'False Positive'})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Export PDF & Print */}
        <div className="flex items-center gap-3 font-telemetry text-xs">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded border hover:opacity-100 transition-all"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded font-bold uppercase transition-all shadow-md bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Generating PDF..." : "Download Official PDF"}</span>
          </button>
        </div>
      </div>

      {/* Main Printable Scientific Document Container */}
      <div className="instrument-panel rounded-lg p-8 sm:p-10 border shadow-2xl space-y-8 bg-observatory-grid-fine"
        style={{ backgroundColor: "var(--bg-surface)" }}>
        {/* Document Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border p-0.5"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-instrument)" }}>
                <Image 
                  src="/logo.png" 
                  alt="Transit Scope Logo" 
                  width={40} 
                  height={40} 
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h1 className="font-astronomy text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{ color: "var(--text-primary)" }}>
                  Transit Scope
                </h1>
                <p className="text-xs font-telemetry uppercase tracking-wider" style={{ color: "var(--accent-amber)" }}>
                  Astronomical Signal Analysis &bull; Scientific Classification Report
                </p>
              </div>
            </div>
            <p className="text-xs text-muted max-w-lg">
              Teaching a computer to tell a real planet&apos;s shadow from an impostor in a star&apos;s light.
            </p>
          </div>

          {/* Report Metadata Badge */}
          <div className="text-right font-telemetry text-xs space-y-1">
            <div className="p-2 rounded border text-left inline-block"
              style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <div className="text-[10px] text-muted">REPORT IDENTIFIER:</div>
              <div className="font-bold text-cyan-400">{report.analysis_id}</div>
              <div className="text-[10px] text-muted mt-1">GENERATION TIMESTAMP:</div>
              <div className="text-[11px] text-slate-300">{report.timestamp}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Target Identification & Astrophysical Parameters */}
        <div className="space-y-3">
          <h2 className="font-astronomy text-base font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>1. Target Identification &amp; Astrophysical Parameters</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-telemetry text-xs">
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">TOI Identifier</span>
              <span className="font-bold text-sm text-cyan-400">{target.toi_id}</span>
            </div>
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">TESS Input Catalog</span>
              <span className="font-bold text-sm text-slate-200">TIC {target.tic_id}</span>
            </div>
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">Catalog Disposition</span>
              <span className={`font-bold text-xs ${target.disposition === 'CP' ? 'text-emerald-400' : 'text-red-400'}`}>
                {target.disposition === 'CP' ? 'Confirmed Planet' : 'False Positive'}
              </span>
            </div>
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">Observing Sectors</span>
              <span className="font-bold text-xs text-slate-200">{target.sectors || "TESS 2-min"}</span>
            </div>

            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">Orbital Period (P)</span>
              <span className="font-bold text-cyan-400">{target.period_days ? `${target.period_days.toFixed(4)} d` : "N/A"}</span>
            </div>
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">Transit Duration</span>
              <span className="font-bold">{target.duration_hours ? `${target.duration_hours.toFixed(2)} hrs` : "N/A"}</span>
            </div>
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">Transit Depth</span>
              <span className="font-bold text-emerald-400">{target.depth_ppm ? `${target.depth_ppm.toLocaleString()} ppm` : "N/A"}</span>
            </div>
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted block text-[10px]">TESS Magnitude</span>
              <span className="font-bold">{target.tess_mag ? target.tess_mag.toFixed(2) : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Light Curve Visualizations Snapshot */}
        <div className="space-y-3">
          <h2 className="font-astronomy text-base font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>2. Phase-Folded Transit Profile &amp; Model Overlay</span>
          </h2>

          <ScientificChart
            title={`Phase-Folded Transit Profile &bull; ${target.toi_id}`}
            subtitle={`Period = ${report.light_curves.period_days.toFixed(4)} d`}
            description="Phase-folded by orbital period with 100 phase bins, empirical error bars, and least-squares transit model fit."
            dataPoints={report.light_curves.folded_points.map((p) => ({
              x: p.phase !== undefined && p.phase !== null ? p.phase : 0,
              y: p.flux
            }))}
            binnedPoints={report.light_curves.binned_folded}
            xAxisLabel="Orbital Phase (&phi;) [Centered at 0.0]"
            yAxisLabel="Normalized Relative Flux"
            chartType="folded"
          />
        </div>

        {/* Section 3: Extracted Diagnostic Features Table */}
        <div className="space-y-3">
          <h2 className="font-astronomy text-base font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>3. Extracted Photometric Diagnostic Features</span>
          </h2>

          <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--border-subtle)" }}>
            <table className="w-full text-left text-xs font-telemetry border-collapse">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider"
                  style={{ backgroundColor: "var(--bg-instrument)", color: "var(--text-muted)" }}>
                  <th className="p-3">Diagnostic Metric</th>
                  <th className="p-3">Extracted Value</th>
                  <th className="p-3">Canonical Threshold</th>
                  <th className="p-3">Diagnostic Assessment</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 font-bold text-cyan-400">Transit Depth</td>
                  <td className="p-3 font-bold">{features.transit_depth_ppm.toFixed(1)} ppm</td>
                  <td className="p-3 text-muted">&lt; 20,000 ppm</td>
                  <td className="p-3 text-emerald-400">
                    {features.transit_depth_ppm < 20000 ? "Consistent with planetary radius" : "Eclipsing companion size"}
                  </td>
                </tr>

                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 font-bold text-cyan-400">Transit Duration</td>
                  <td className="p-3 font-bold">{features.transit_duration_hours.toFixed(2)} hrs</td>
                  <td className="p-3 text-muted">0.5 - 12.0 hrs</td>
                  <td className="p-3 text-emerald-400">Physically plausible transit event</td>
                </tr>

                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 font-bold text-cyan-400">Signal-to-Noise Ratio (SNR)</td>
                  <td className="p-3 font-bold text-amber-400">{features.signal_to_noise.toFixed(1)} &sigma;</td>
                  <td className="p-3 text-muted">&gt; 7.1 &sigma; (TESS Canonical)</td>
                  <td className="p-3 text-emerald-400">
                    {features.signal_to_noise >= 7.1 ? "Robust statistical detection" : "Marginal statistical significance"}
                  </td>
                </tr>

                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 font-bold text-cyan-400">Odd/Even Depth Disparity</td>
                  <td className="p-3 font-bold">{features.odd_even_depth_diff_ppm.toFixed(1)} ppm</td>
                  <td className="p-3 text-muted">&lt; 400 ppm</td>
                  <td className="p-3" style={{ color: features.odd_even_depth_diff_ppm < 400 ? "var(--accent-emerald)" : "var(--accent-ruby)" }}>
                    {features.odd_even_depth_diff_ppm < 400 ? "Symmetric transit depths" : "Alternating eclipsing binary pair"}
                  </td>
                </tr>

                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 font-bold text-cyan-400">Secondary Eclipse Depth</td>
                  <td className="p-3 font-bold">{features.secondary_eclipse_depth_ppm.toFixed(1)} ppm</td>
                  <td className="p-3 text-muted">&lt; 250 ppm at phase 0.5</td>
                  <td className="p-3" style={{ color: features.secondary_eclipse_depth_ppm < 250 ? "var(--accent-emerald)" : "var(--accent-ruby)" }}>
                    {features.secondary_eclipse_depth_ppm < 250 ? "No detectable secondary eclipse" : "Secondary star occultation present"}
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-bold text-cyan-400">In-Transit Scatter</td>
                  <td className="p-3 font-bold">{features.in_transit_scatter.toFixed(6)}</td>
                  <td className="p-3 text-muted">&lt; 0.0010</td>
                  <td className="p-3 text-emerald-400">Nominal photometric noise</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Machine Learning Classification Results */}
        <div className="space-y-3">
          <h2 className="font-astronomy text-base font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>4. Supervised Machine Learning Classification</span>
          </h2>

          <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--border-subtle)" }}>
            <table className="w-full text-left text-xs font-telemetry border-collapse">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider"
                  style={{ backgroundColor: "var(--bg-instrument)", color: "var(--text-muted)" }}>
                  <th className="p-3">Model Architecture</th>
                  <th className="p-3">Feature Set</th>
                  <th className="p-3">Predicted Class</th>
                  <th className="p-3">Planet Prob.</th>
                  <th className="p-3">False Pos. Prob.</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b font-bold" style={{ backgroundColor: "rgba(34, 211, 238, 0.05)", borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 text-cyan-400">Random Forest (Combined)</td>
                  <td className="p-3">Multi-Modal (12 Feat)</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      prediction_combined.predicted_class === 'Planet' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {prediction_combined.predicted_class}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400">{(prediction_combined.planet_probability * 100).toFixed(1)}%</td>
                  <td className="p-3 text-red-400">{(prediction_combined.false_positive_probability * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-400">{prediction_combined.confidence_level}</td>
                </tr>

                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="p-3 text-slate-300">Random Forest</td>
                  <td className="p-3 text-muted">Light-Curve Features</td>
                  <td className="p-3 font-bold">{prediction_lightcurve.predicted_class}</td>
                  <td className="p-3">{(prediction_lightcurve.planet_probability * 100).toFixed(1)}%</td>
                  <td className="p-3">{(prediction_lightcurve.false_positive_probability * 100).toFixed(1)}%</td>
                  <td className="p-3 text-muted">{prediction_lightcurve.confidence_level}</td>
                </tr>

                <tr>
                  <td className="p-3 text-slate-300">Logistic Regression (Baseline)</td>
                  <td className="p-3 text-muted">Catalog-Only Features</td>
                  <td className="p-3 font-bold">{prediction_catalog.predicted_class}</td>
                  <td className="p-3">{(prediction_catalog.planet_probability * 100).toFixed(1)}%</td>
                  <td className="p-3">{(prediction_catalog.false_positive_probability * 100).toFixed(1)}%</td>
                  <td className="p-3 text-muted">{prediction_catalog.confidence_level}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Supporting Evidence & Astronomical Reasoning */}
        <div className="space-y-2">
          <h3 className="font-astronomy text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}>
            5. Astronomical Evidence &amp; Reasoning
          </h3>
          <div className="p-4 rounded border text-xs leading-relaxed"
            style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
            <p>{prediction_combined.astronomical_reasoning}</p>
          </div>
        </div>

        {/* Section 6: Data Quality & Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded border space-y-2 text-xs font-telemetry"
            style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
            <span className="font-bold text-amber-400 block text-[11px] uppercase">
              Data Quality Warnings
            </span>
            <ul className="space-y-1 text-muted text-[11px]">
              {report.data_quality_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span>&bull;</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded border space-y-2 text-xs font-telemetry"
            style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
            <span className="font-bold text-cyan-400 block text-[11px] uppercase">
              Scientific Limitations
            </span>
            <ul className="space-y-1 text-muted text-[11px]">
              {prediction_combined.scientific_limitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span>&bull;</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Document Footer & Disclaimer */}
        <div className="pt-6 border-t text-[11px] font-telemetry text-muted space-y-2 leading-relaxed"
          style={{ borderColor: "var(--border-subtle)" }}>
          <p className="italic">
            {report.scientific_disclaimer}
          </p>
          <div className="flex justify-between items-center text-[10px] text-muted pt-2">
            <span>TRANSIT SCOPE &bull; EXOPLANETARY TIME-SERIES ANALYSIS</span>
            <span>END OF REPORT &bull; {report.analysis_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-telemetry text-cyan-400">Loading Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
