"use client";

import React, { useState } from "react";
import { Info, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface FeatureCardProps {
  name: string;
  value: number;
  unit: string;
  threshold?: string;
  verdict?: "nominal" | "warning" | "suspicious";
  whatItMeasures: string;
  whyItMatters: string;
  howItDistinguishes: string;
  isValid: boolean;
  reliabilityNote?: string;
}

export function FeatureCard({
  name,
  value,
  unit,
  threshold,
  verdict = "nominal",
  whatItMeasures,
  whyItMatters,
  howItDistinguishes,
  isValid,
  reliabilityNote
}: FeatureCardProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const verdictStyles = {
    nominal: {
      badgeColor: "var(--accent-emerald)",
      badgeBg: "rgba(16, 185, 129, 0.12)",
      label: "Consistent with Planet"
    },
    warning: {
      badgeColor: "var(--accent-amber)",
      badgeBg: "rgba(245, 158, 11, 0.12)",
      label: "Elevated / Marginal"
    },
    suspicious: {
      badgeColor: "var(--accent-ruby)",
      badgeBg: "rgba(239, 68, 68, 0.12)",
      label: "False Positive Signature"
    }
  }[verdict];

  return (
    <div className="instrument-panel rounded-lg p-4 border shadow-sm transition-all hover:border-[var(--border-strong)]">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-astronomy text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-primary)" }}>
          {name}
        </h4>
        <span
          className="text-[10px] font-telemetry font-bold px-2 py-0.5 rounded-full border"
          style={{
            color: verdictStyles.badgeColor,
            backgroundColor: verdictStyles.badgeBg,
            borderColor: verdictStyles.badgeColor
          }}
        >
          {verdictStyles.label}
        </span>
      </div>

      {/* Numerical measurement readout */}
      <div className="flex items-baseline gap-2 my-2">
        <span className="font-telemetry text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}>
          {typeof value === "number" ? (value < 0.01 && value > 0 ? value.toExponential(3) : value.toLocaleString()) : value}
        </span>
        <span className="font-telemetry text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {unit}
        </span>
      </div>

      {/* Threshold reference */}
      {threshold && (
        <div className="text-[11px] font-telemetry mb-3 flex items-center justify-between"
          style={{ color: "var(--text-muted)" }}>
          <span>Canonical Threshold:</span>
          <span style={{ color: "var(--text-secondary)" }}>{threshold}</span>
        </div>
      )}

      {/* Reliability flag */}
      <div className="flex items-center gap-1.5 text-[11px] mb-2 font-telemetry">
        {isValid ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span style={{ color: isValid ? "var(--text-secondary)" : "var(--accent-amber)" }}>
          {isValid ? "Measurement Validated" : (reliabilityNote || "Noisy Cadences Detected")}
        </span>
      </div>

      {/* Toggle Details Accordion */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between pt-2 mt-2 border-t text-[11px] font-telemetry transition-colors hover:opacity-100"
        style={{ borderColor: "var(--border-subtle)", color: "var(--accent-cyan)" }}
      >
        <span>{expanded ? "Hide Scientific Diagnostics" : "Explain Diagnostic Role"}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Scientific Explanation */}
      {expanded && (
        <div className="mt-3 pt-2 space-y-2 text-xs border-t animate-in fade-in"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <div>
            <span className="font-bold text-[10px] uppercase font-telemetry block text-amber-400">
              What it measures:
            </span>
            <p className="leading-relaxed">{whatItMeasures}</p>
          </div>
          <div>
            <span className="font-bold text-[10px] uppercase font-telemetry block text-cyan-400">
              Why it matters:
            </span>
            <p className="leading-relaxed">{whyItMatters}</p>
          </div>
          <div>
            <span className="font-bold text-[10px] uppercase font-telemetry block text-emerald-400">
              Planet vs. False Positive distinction:
            </span>
            <p className="leading-relaxed">{howItDistinguishes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

