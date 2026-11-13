"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Telescope, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ArrowRight,
  Database,
  ShieldCheck,
  FileText
} from "lucide-react";
import { 
  searchTargets, 
  getExampleTargets, 
  runAnalysis, 
  TargetCatalogItem, 
  FullAnalysisReport 
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TargetCatalogItem[]>([]);
  const [exampleTargets, setExampleTargets] = useState<TargetCatalogItem[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetCatalogItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentTargets, setRecentTargets] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load example targets and recent history on mount
  useEffect(() => {
    getExampleTargets()
      .then((targets) => {
        setExampleTargets(targets);
        if (targets.length > 0) {
          setSelectedTarget(targets[0]); // Default to TOI-700.01
        }
      })
      .catch((err) => {
        console.error("Failed to load targets:", err);
      });

    try {
      const stored = localStorage.getItem("transit_scope_recent");
      if (stored) {
        setRecentTargets(JSON.parse(stored));
      } else {
        setRecentTargets(["TOI-700.01", "TOI-178.01", "TOI-114.01", "TOI-125.01"]);
      }
    } catch {
      setRecentTargets(["TOI-700.01", "TOI-178.01", "TOI-114.01"]);
    }
  }, []);

  // Handle live search
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    setErrorMessage(null);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchTargets(q);
      setSearchResults(res.results);
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Run full scientific pipeline on selected target
  const handleExecuteAnalysis = async (target: TargetCatalogItem) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const report = await runAnalysis(target.toi_id);
      // Save recent history
      const updated = Array.from(new Set([target.toi_id, ...recentTargets])).slice(0, 6);
      setRecentTargets(updated);
      try {
        localStorage.setItem("transit_scope_recent", JSON.stringify(updated));
        localStorage.setItem("transit_scope_active_toi", target.toi_id);
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
      // Navigate to Light Curve Lab
      router.push(`/light-curve-lab?toi=${encodeURIComponent(target.toi_id)}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Analysis failed to execute.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="led-indicator led-cyan" />
            <h1 className="font-astronomy text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              Observatory Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-telemetry mt-1" style={{ color: "var(--text-muted)" }}>
            PRIMARY OBSERVATIONAL TELEMETRY &bull; TESS OBJECTS OF INTEREST (TOI)
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 font-telemetry text-xs">
          <div className="px-3 py-1 rounded border flex items-center gap-1.5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>NASA TAP: SYNCED</span>
          </div>
          <div className="px-3 py-1 rounded border flex items-center gap-1.5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>ML ENGINE: LOADED</span>
          </div>
        </div>
      </div>

      {/* Search & Suggestions Bar */}
      <div className="relative">
        <div className="instrument-panel rounded-lg p-3 border shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 shrink-0" style={{ color: "var(--accent-cyan)" }} />
          <input
            type="text"
            placeholder="Search by TOI ID (e.g. TOI-700.01 or 178) or TIC ID (e.g. 150428135)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm font-telemetry"
            style={{ color: "var(--text-primary)" }}
          />
          {isSearching && (
            <span className="text-xs font-telemetry animate-pulse" style={{ color: "var(--accent-amber)" }}>
              Querying TAP...
            </span>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-lg border shadow-xl max-h-72 overflow-y-auto p-1 font-telemetry text-xs"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}>
            {searchResults.map((item) => (
              <div
                key={item.toi_id}
                onClick={() => {
                  setSelectedTarget(item);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-cyan-500/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-400">{item.toi_id}</span>
                  <span className="text-muted">(TIC {item.tic_id})</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    item.disposition === 'CP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.disposition === 'CP' ? 'Confirmed Planet' : 'False Positive'}
                  </span>
                </div>
                <div className="text-[11px] text-muted">
                  P = {item.period_days ? item.period_days.toFixed(2) : "?"} d &bull; Depth = {item.depth_ppm || "?"} ppm
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="p-3 rounded border flex items-center gap-2 text-xs font-telemetry text-red-400 bg-red-500/10 border-red-500/30">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Active Target Telemetry & Action Panel */}
      {selectedTarget && (
        <div className="instrument-panel rounded-lg p-6 border shadow-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
            style={{ borderColor: "var(--border-subtle)" }}>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-astronomy text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {selectedTarget.toi_id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-telemetry font-bold border ${
                  selectedTarget.disposition === 'CP'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/50 bg-red-500/10 text-red-400'
                }`}>
                  {selectedTarget.disposition === 'CP' ? 'CONFIRMED PLANET' : 'FALSE POSITIVE'}
                </span>
                {selectedTarget.is_cached_demo && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-telemetry border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    VERIFIED OBSERVATORY BENCHMARK
                  </span>
                )}
              </div>
              <p className="text-xs font-telemetry mt-1" style={{ color: "var(--text-muted)" }}>
                TESS Input Catalog: TIC {selectedTarget.tic_id} &bull; Sectors: {selectedTarget.sectors || "SPOC 2-min"}
              </p>
            </div>

            {/* Launch Analysis Action CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExecuteAnalysis(selectedTarget)}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--accent-cyan)",
                  color: "#020617"
                }}
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Processing Light Curves...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Analyze Signal in Lab</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Telemetry Parameter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-telemetry text-xs">
            <div className="p-3 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase text-muted">Orbital Period</span>
              <span className="text-base font-bold text-cyan-400">
                {selectedTarget.period_days ? `${selectedTarget.period_days.toFixed(4)} d` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase text-muted">Transit Duration</span>
              <span className="text-base font-bold text-cyan-400">
                {selectedTarget.duration_hours ? `${selectedTarget.duration_hours.toFixed(2)} hrs` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase text-muted">Transit Depth</span>
              <span className="text-base font-bold text-emerald-400">
                {selectedTarget.depth_ppm ? `${selectedTarget.depth_ppm.toLocaleString()} ppm` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase text-muted">TESS Magnitude</span>
              <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {selectedTarget.tess_mag ? selectedTarget.tess_mag.toFixed(2) : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase text-muted">Stellar Temp (Teff)</span>
              <span className="text-base font-bold text-amber-400">
                {selectedTarget.teff_k ? `${selectedTarget.teff_k.toFixed(0)} K` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="block text-[10px] uppercase text-muted">Stellar Radius</span>
              <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {selectedTarget.stellar_radius_solar ? `${selectedTarget.stellar_radius_solar.toFixed(2)} R☉` : "N/A"}
              </span>
            </div>
          </div>

          {/* Quick Module Navigation Links for Active Target */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs font-telemetry">
            <Link
              href={`/light-curve-lab?toi=${encodeURIComponent(selectedTarget.toi_id)}`}
              className="p-3 rounded border flex items-center justify-between hover:border-cyan-400/50 transition-colors"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Light Curve Lab</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
            </Link>

            <Link
              href={`/signal-analysis?toi=${encodeURIComponent(selectedTarget.toi_id)}`}
              className="p-3 rounded border flex items-center justify-between hover:border-amber-400/50 transition-colors"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Signal Diagnostics</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
            </Link>

            <Link
              href={`/classification-lab?toi=${encodeURIComponent(selectedTarget.toi_id)}`}
              className="p-3 rounded border flex items-center justify-between hover:border-emerald-400/50 transition-colors"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>ML Classification</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
            </Link>

            <Link
              href={`/report?toi=${encodeURIComponent(selectedTarget.toi_id)}`}
              className="p-3 rounded border flex items-center justify-between hover:border-indigo-400/50 transition-colors"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Scientific Report</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
            </Link>
          </div>
        </div>
      )}

      {/* Verified Observatory Example Targets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="led-indicator led-emerald" />
            <h2 className="font-astronomy text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Verified Scientific Benchmark Targets
            </h2>
          </div>
          <span className="text-xs font-telemetry" style={{ color: "var(--text-muted)" }}>
            REAL TESS OBSERVATIONAL DATA PRE-LOADED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exampleTargets.slice(0, 8).map((target) => {
            const isSelected = selectedTarget?.toi_id === target.toi_id;
            return (
              <div
                key={target.toi_id}
                onClick={() => setSelectedTarget(target)}
                className={`instrument-panel rounded-lg p-4 border cursor-pointer transition-all hover:scale-[1.02] ${
                  isSelected ? 'border-[var(--accent-cyan)] shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--bg-surface-elevated)" : "var(--bg-surface)"
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-astronomy font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {target.toi_id}
                  </span>
                  <span className={`text-[10px] font-telemetry font-bold px-1.5 py-0.5 rounded ${
                    target.disposition === 'CP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {target.disposition === 'CP' ? 'Confirmed Planet' : 'False Positive'}
                  </span>
                </div>

                <div className="space-y-1 font-telemetry text-xs" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex justify-between">
                    <span className="text-muted">Period:</span>
                    <span className="font-medium text-cyan-400">{target.period_days?.toFixed(2)} d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Depth:</span>
                    <span className="font-medium text-emerald-400">{target.depth_ppm?.toLocaleString()} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Duration:</span>
                    <span>{target.duration_hours?.toFixed(2)} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Host Teff:</span>
                    <span className="text-amber-400">{target.teff_k?.toFixed(0)} K</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-telemetry"
                  style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-muted">TIC {target.tic_id}</span>
                  <span className="text-cyan-400 hover:underline">Select &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
