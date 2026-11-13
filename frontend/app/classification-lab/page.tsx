"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Layers, 
  ArrowRight, 
  Sliders, 
  BarChart3, 
  ShieldCheck,
  FileText
} from "lucide-react";
import { 
  runAnalysis, 
  getExampleTargets, 
  getModelMetrics, 
  FullAnalysisReport, 
  TargetCatalogItem, 
  ModelIntelligenceResponse,
  ModelEvaluationMetrics
} from "@/lib/api";
import { ConfusionMatrix } from "@/components/ConfusionMatrix";

function ClassificationLabContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toiParam = searchParams.get("toi") || "TOI-700.01";

  const [activeToi, setActiveToi] = useState<string>(toiParam);
  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [exampleTargets, setExampleTargets] = useState<TargetCatalogItem[]>([]);
  const [modelIntelligence, setModelIntelligence] = useState<ModelIntelligenceResponse | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<"combined" | "catalog_only" | "lightcurve_only">("combined");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"rf" | "lr">("rf");
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.50);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getExampleTargets().then((targets) => setExampleTargets(targets)).catch(() => {});
    getModelMetrics().then((metrics) => setModelIntelligence(metrics)).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    runAnalysis(activeToi)
      .then((data) => setReport(data))
      .catch((err: any) => setErrorMessage(err.message || "Failed to classify target."))
      .finally(() => setIsLoading(false));
  }, [activeToi]);

  const handleTargetChange = (newToi: string) => {
    setActiveToi(newToi);
    router.push(`/classification-lab?toi=${encodeURIComponent(newToi)}`);
  };

  // Find active model prediction from report based on configuration
  const activePrediction = report
    ? selectedConfig === "combined"
      ? report.prediction_combined
      : selectedConfig === "catalog_only"
      ? report.prediction_catalog
      : report.prediction_lightcurve
    : null;

  // Find corresponding evaluated model metrics from backend
  const activeModelMetrics: ModelEvaluationMetrics | undefined = modelIntelligence?.models.find((m) => {
    const isRf = m.model_name.includes("Random Forest");
    const matchesAlg = selectedAlgorithm === "rf" ? isRf : !isRf;
    return matchesAlg && m.feature_configuration === selectedConfig;
  });

  // Dynamically compute class label based on custom decision threshold
  const adjustedClass = activePrediction
    ? activePrediction.planet_probability >= decisionThreshold
      ? "Planet"
      : "False Positive"
    : "Unknown";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="led-indicator led-emerald" />
            <h1 className="font-astronomy text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              Classification Lab &bull; Supervised Machine Learning
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-telemetry mt-1" style={{ color: "var(--text-muted)" }}>
            STAR-ISOLATED GROUP-KFOLD INFERENCE &bull; MULTI-MODAL FEATURE EVALUATION
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

      {/* Model Configuration Selector Bar */}
      <div className="instrument-panel rounded-lg p-4 border shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-telemetry">
        {/* Feature Set selector */}
        <div className="flex items-center gap-2">
          <span className="text-muted">Feature Set:</span>
          <div className="flex items-center gap-1">
            {[
              { id: "combined", label: "Combined Multi-Modal" },
              { id: "lightcurve_only", label: "Light-Curve Only" },
              { id: "catalog_only", label: "Catalog-Only Baseline" }
            ].map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => setSelectedConfig(cfg.id as any)}
                className={`px-3 py-1.5 rounded border transition-all ${
                  selectedConfig === cfg.id ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: selectedConfig === cfg.id ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: selectedConfig === cfg.id ? "var(--accent-cyan)" : "var(--border-color)",
                  color: selectedConfig === cfg.id ? "var(--accent-cyan)" : "var(--text-secondary)"
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm selector */}
        <div className="flex items-center gap-2">
          <span className="text-muted">Classifier:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedAlgorithm("rf")}
              className={`px-3 py-1.5 rounded border transition-all ${
                selectedAlgorithm === "rf" ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: selectedAlgorithm === "rf" ? "var(--bg-surface-elevated)" : "transparent",
                borderColor: selectedAlgorithm === "rf" ? "var(--accent-emerald)" : "var(--border-color)",
                color: selectedAlgorithm === "rf" ? "var(--accent-emerald)" : "var(--text-secondary)"
              }}
            >
              Random Forest
            </button>
            <button
              onClick={() => setSelectedAlgorithm("lr")}
              className={`px-3 py-1.5 rounded border transition-all ${
                selectedAlgorithm === "lr" ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: selectedAlgorithm === "lr" ? "var(--bg-surface-elevated)" : "transparent",
                borderColor: selectedAlgorithm === "lr" ? "var(--accent-amber)" : "var(--border-color)",
                color: selectedAlgorithm === "lr" ? "var(--accent-amber)" : "var(--text-secondary)"
              }}
            >
              Logistic Regression
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-20 text-center text-muted font-telemetry space-y-3">
          <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-sm font-bold text-cyan-400">Evaluating Supervised Classification...</p>
          <p className="text-xs">Computing decision probabilities and feature impacts.</p>
        </div>
      ) : report && activePrediction ? (
        <div className="space-y-8">
          {/* Main Prediction Readout Card */}
          <div className="instrument-panel rounded-lg p-6 border shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
              style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-astronomy text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {report.target.toi_id} Classification Verdict
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-telemetry font-bold border ${
                    adjustedClass === 'Planet'
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                      : 'border-red-500/60 bg-red-500/15 text-red-400'
                  }`}>
                    {adjustedClass === 'Planet' ? 'VERDICT: PLANET' : 'VERDICT: FALSE POSITIVE'}
                  </span>
                </div>
                <p className="text-xs font-telemetry text-muted mt-1">
                  Evaluated using {activePrediction.model_name} &bull; Decision Threshold &tau; = {decisionThreshold.toFixed(2)}
                </p>
              </div>

              {/* Confidence Badge */}
              <div className="text-right font-telemetry text-xs">
                <span className="text-muted block text-[10px]">MODEL CONFIDENCE</span>
                <span className={`font-bold text-sm ${
                  activePrediction.confidence_level === 'High' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {activePrediction.confidence_level} Confidence
                </span>
              </div>
            </div>

            {/* Probability Distribution Gauge */}
            <div className="space-y-2 font-telemetry text-xs">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Planet Probability: {(activePrediction.planet_probability * 100).toFixed(1)}%</span>
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>False Positive: {(activePrediction.false_positive_probability * 100).toFixed(1)}%</span>
                </span>
              </div>

              {/* Multi-color dual probability bar */}
              <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${activePrediction.planet_probability * 100}%` }}
                />
                <div
                  className="h-full bg-red-400 transition-all duration-500"
                  style={{ width: `${activePrediction.false_positive_probability * 100}%` }}
                />
              </div>

              {/* Threshold indicator line marker */}
              <div className="relative w-full h-4 text-[10px] text-muted">
                <div
                  className="absolute -top-1 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${decisionThreshold * 100}%` }}
                >
                  <span className="text-amber-400">&Delta;</span>
                  <span className="text-[9px] text-amber-400">&tau;={decisionThreshold.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Decision Threshold Slider */}
            <div className="p-3 rounded border font-telemetry text-xs space-y-2"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Interactive Decision Boundary (&tau;)</span>
                </span>
                <span className="text-muted">Default: 0.50</span>
              </div>
              <p className="text-[11px] text-muted">
                Adjust the sensitivity threshold for planet candidate screening. Lowering &tau; increases recall (fewer missed planets); raising &tau; increases precision (fewer false alarms).
              </p>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={decisionThreshold}
                onChange={(e) => setDecisionThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Top Contributing Feature Factors */}
            <div className="space-y-3">
              <h3 className="font-astronomy text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--text-primary)" }}>
                Key Contributing Physical Features
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-telemetry text-xs">
                {activePrediction.top_contributing_features.map((feat, i) => (
                  <div key={i} className="p-3 rounded border"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-cyan-400">{feat.feature}</span>
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {feat.importance.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mb-2">{feat.description}</p>
                    {feat.direction && (
                      <span className="text-[10px] font-bold block" style={{ color: "var(--accent-amber)" }}>
                        &bull; {feat.direction}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Astronomical Reasoning */}
            <div className="p-4 rounded border text-xs leading-relaxed space-y-1"
              style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
              <span className="font-bold text-cyan-400 block font-telemetry">
                ASTRONOMICAL REASONING:
              </span>
              <p style={{ color: "var(--text-secondary)" }}>
                {activePrediction.astronomical_reasoning}
              </p>
            </div>
          </div>

          {/* Model Evaluation Performance Cards */}
          {activeModelMetrics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="led-indicator led-cyan" />
                  <h2 className="font-astronomy text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    Rigorous Star-Isolated Group-KFold Evaluation Metrics
                  </h2>
                </div>
                <span className="text-xs font-telemetry text-muted">
                  NO STAR IN BOTH TRAIN &amp; TEST PARTITIONS
                </span>
              </div>

              {/* Numerical Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-telemetry text-xs">
                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <span className="block text-[10px] uppercase text-muted">Accuracy</span>
                  <span className="text-xl font-bold text-cyan-400">
                    {(activeModelMetrics.accuracy * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <span className="block text-[10px] uppercase text-muted">Precision</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {(activeModelMetrics.precision * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <span className="block text-[10px] uppercase text-muted">Recall</span>
                  <span className="text-xl font-bold text-amber-400">
                    {(activeModelMetrics.recall * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <span className="block text-[10px] uppercase text-muted">F1-Score</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {(activeModelMetrics.f1_score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <span className="block text-[10px] uppercase text-muted">ROC-AUC</span>
                  <span className="text-xl font-bold text-cyan-400">
                    {(activeModelMetrics.roc_auc).toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Confusion Matrix Visual */}
              <ConfusionMatrix
                matrix={activeModelMetrics.confusion_matrix}
                modelName={activeModelMetrics.model_name}
                config={activeModelMetrics.feature_configuration}
              />
            </div>
          )}

          {/* Action Link to Full Report */}
          <div className="flex justify-end pt-4">
            <Link
              href={`/report?toi=${encodeURIComponent(report.target.toi_id)}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs uppercase font-telemetry bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Compile Full Scientific Report &rarr;</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ClassificationLabPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-telemetry text-cyan-400">Loading Classification Lab...</div>}>
      <ClassificationLabContent />
    </Suspense>
  );
}

