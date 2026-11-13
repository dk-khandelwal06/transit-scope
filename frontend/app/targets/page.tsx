"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Activity, 
  ArrowUpDown, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from "lucide-react";
import { searchTargets, getExampleTargets, TargetCatalogItem } from "@/lib/api";

export default function TargetExplorerPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filterDisposition, setFilterDisposition] = useState<string>("ALL");
  const [targets, setTargets] = useState<TargetCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof TargetCatalogItem>("period_days");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<TargetCatalogItem | null>(null);

  // Load verified observatory baseline targets initially
  useEffect(() => {
    setIsLoading(true);
    getExampleTargets()
      .then((data) => setTargets(data))
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearch = async (q: string) => {
    setQuery(q);
    setIsLoading(true);
    try {
      const res = await searchTargets(q);
      setTargets(res.results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof TargetCatalogItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter & sort
  const filteredTargets = targets
    .filter((t) => {
      if (filterDisposition === "ALL") return true;
      if (filterDisposition === "CP") return t.disposition === "CP" || t.disposition === "KP";
      if (filterDisposition === "FP") return t.disposition === "FP" || t.disposition === "FA";
      if (filterDisposition === "PC") return t.disposition === "PC";
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="led-indicator led-cyan" />
            <h1 className="font-astronomy text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              Target Explorer &bull; TOI Archive
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-telemetry mt-1" style={{ color: "var(--text-muted)" }}>
            NASA EXOPLANET ARCHIVE TAP INTERFACE &bull; TABLE ACCESS PROTOCOL
          </p>
        </div>

        {/* Catalog stats */}
        <div className="flex items-center gap-2 text-xs font-telemetry" style={{ color: "var(--text-secondary)" }}>
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Query: {filteredTargets.length} Targets Loaded</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="instrument-panel rounded-lg p-4 border shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by TOI ID (e.g. 700.01) or TIC ID (e.g. 150428135)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-telemetry"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Disposition Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-telemetry">
          <span className="text-muted mr-1 hidden sm:inline">Disposition:</span>
          {[
            { id: "ALL", label: "All" },
            { id: "CP", label: "Confirmed Planets (CP)" },
            { id: "FP", label: "False Positives (FP)" },
            { id: "PC", label: "Candidates (PC)" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterDisposition(item.id)}
              className={`px-2.5 py-1 rounded border text-[11px] transition-all ${
                filterDisposition === item.id ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: filterDisposition === item.id ? "var(--bg-surface-elevated)" : "transparent",
                borderColor: filterDisposition === item.id ? "var(--accent-cyan)" : "var(--border-color)",
                color: filterDisposition === item.id ? "var(--accent-cyan)" : "var(--text-secondary)"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Targets Table */}
      <div className="instrument-panel rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-telemetry border-collapse">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("toi_id")}>
                  <div className="flex items-center gap-1">
                    <span>TOI ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">TIC ID</th>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("disposition")}>
                  <div className="flex items-center gap-1">
                    <span>Disposition</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("period_days")}>
                  <div className="flex items-center gap-1">
                    <span>Period (d)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("depth_ppm")}>
                  <div className="flex items-center gap-1">
                    <span>Depth (ppm)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("duration_hours")}>
                  <div className="flex items-center gap-1">
                    <span>Duration (h)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("tess_mag")}>
                  <div className="flex items-center gap-1">
                    <span>TESS Mag</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-cyan-400" onClick={() => handleSort("teff_k")}>
                  <div className="flex items-center gap-1">
                    <span>Host Teff</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted">
                    <Activity className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    <span>Querying NASA Exoplanet Archive TAP service...</span>
                  </td>
                </tr>
              ) : filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted">
                    No matching targets found in catalog query.
                  </td>
                </tr>
              ) : (
                filteredTargets.map((t) => (
                  <tr
                    key={t.toi_id}
                    className="border-b transition-colors hover:bg-cyan-500/5 cursor-pointer"
                    style={{ borderColor: "var(--border-subtle)" }}
                    onClick={() => setSelectedTarget(t)}
                  >
                    <td className="p-3 font-bold text-cyan-400">
                      {t.toi_id}
                    </td>
                    <td className="p-3 text-muted">
                      {t.tic_id}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.disposition === 'CP' || t.disposition === 'KP'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : t.disposition === 'FP' || t.disposition === 'FA'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.disposition === 'CP' ? 'Confirmed Planet' : t.disposition === 'FP' ? 'False Positive' : 'Candidate'}
                      </span>
                    </td>
                    <td className="p-3 text-cyan-400">
                      {t.period_days ? t.period_days.toFixed(4) : "—"}
                    </td>
                    <td className="p-3 text-emerald-400">
                      {t.depth_ppm ? t.depth_ppm.toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      {t.duration_hours ? t.duration_hours.toFixed(2) : "—"}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-secondary)" }}>
                      {t.tess_mag ? t.tess_mag.toFixed(2) : "—"}
                    </td>
                    <td className="p-3 text-amber-400">
                      {t.teff_k ? `${t.teff_k.toFixed(0)} K` : "—"}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/light-curve-lab?toi=${encodeURIComponent(t.toi_id)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[11px] border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Analyze</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Detail Modal / Drawer if clicked */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="instrument-panel rounded-lg max-w-xl w-full p-6 border shadow-2xl space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}>
            <div className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <span className="font-astronomy text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {selectedTarget.toi_id} Details
                </span>
                <span className={`text-[10px] font-telemetry font-bold px-2 py-0.5 rounded ${
                  selectedTarget.disposition === 'CP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedTarget.disposition === 'CP' ? 'Confirmed Planet' : 'False Positive'}
                </span>
              </div>
              <button
                onClick={() => setSelectedTarget(null)}
                className="text-muted hover:text-white text-sm font-telemetry"
              >
                &times; Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-telemetry">
              <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
                <span className="text-muted block text-[10px]">TESS Input Catalog</span>
                <span className="font-bold text-cyan-400">TIC {selectedTarget.tic_id}</span>
              </div>
              <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
                <span className="text-muted block text-[10px]">Orbital Period</span>
                <span className="font-bold text-cyan-400">{selectedTarget.period_days?.toFixed(4)} days</span>
              </div>
              <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
                <span className="text-muted block text-[10px]">Transit Depth</span>
                <span className="font-bold text-emerald-400">{selectedTarget.depth_ppm?.toLocaleString()} ppm</span>
              </div>
              <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
                <span className="text-muted block text-[10px]">Transit Duration</span>
                <span className="font-bold">{selectedTarget.duration_hours?.toFixed(2)} hours</span>
              </div>
              <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
                <span className="text-muted block text-[10px]">Host Temperature</span>
                <span className="font-bold text-amber-400">{selectedTarget.teff_k?.toFixed(0)} K</span>
              </div>
              <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-subtle)" }}>
                <span className="text-muted block text-[10px]">Stellar Radius</span>
                <span className="font-bold">{selectedTarget.stellar_radius_solar?.toFixed(2)} R☉</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t"
              style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => setSelectedTarget(null)}
                className="px-3 py-1.5 rounded border text-xs font-telemetry"
                style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
              >
                Close
              </button>
              <Link
                href={`/light-curve-lab?toi=${encodeURIComponent(selectedTarget.toi_id)}`}
                className="px-4 py-1.5 rounded font-bold text-xs uppercase font-telemetry bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                Analyze Light Curves &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

