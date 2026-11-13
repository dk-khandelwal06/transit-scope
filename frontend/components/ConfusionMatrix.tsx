"use client";

import React from "react";

interface ConfusionMatrixProps {
  matrix: number[][]; // [[TN, FP], [FN, TP]]
  modelName: string;
  config: string;
}

export function ConfusionMatrix({ matrix, modelName, config }: ConfusionMatrixProps) {
  if (!matrix || matrix.length < 2 || matrix[0].length < 2) {
    return <div className="text-xs text-muted p-4">Confusion matrix data unavailable.</div>;
  }

  const tn = matrix[0][0];
  const fp = matrix[0][1];
  const fn = matrix[1][0];
  const tp = matrix[1][1];

  const total = tn + fp + fn + tp;
  const tnPct = total > 0 ? ((tn / total) * 100).toFixed(1) : "0";
  const fpPct = total > 0 ? ((fp / total) * 100).toFixed(1) : "0";
  const fnPct = total > 0 ? ((fn / total) * 100).toFixed(1) : "0";
  const tpPct = total > 0 ? ((tp / total) * 100).toFixed(1) : "0";

  return (
    <div className="instrument-panel rounded-lg p-4 border shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b"
        style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <h4 className="font-astronomy text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}>
            Confusion Matrix &bull; {modelName}
          </h4>
          <span className="text-[10px] font-telemetry" style={{ color: "var(--text-muted)" }}>
            Configuration: {config} (Star-Isolated by TIC ID)
          </span>
        </div>
        <span className="text-xs font-telemetry" style={{ color: "var(--accent-cyan)" }}>
          N = {total} Systems
        </span>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs font-telemetry border-collapse">
          <thead>
            <tr>
              <th className="p-2 border" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                Ground Truth \ Pred
              </th>
              <th className="p-2 border" style={{ borderColor: "var(--border-subtle)", color: "var(--accent-ruby)" }}>
                Pred: False Positive
              </th>
              <th className="p-2 border" style={{ borderColor: "var(--border-subtle)", color: "var(--accent-emerald)" }}>
                Pred: Planet
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border font-bold text-left" style={{ borderColor: "var(--border-subtle)", color: "var(--accent-ruby)" }}>
                Actual: False Positive (0)
              </td>
              <td className="p-4 border font-bold"
                style={{ 
                  borderColor: "var(--border-subtle)", 
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  color: "var(--text-primary)"
                }}>
                <div className="text-lg font-bold text-emerald-400">{tn}</div>
                <div className="text-[10px] opacity-70">True Neg ({tnPct}%)</div>
              </td>
              <td className="p-4 border font-bold"
                style={{ 
                  borderColor: "var(--border-subtle)", 
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "var(--text-primary)"
                }}>
                <div className="text-lg font-bold text-red-400">{fp}</div>
                <div className="text-[10px] opacity-70">False Pos ({fpPct}%)</div>
              </td>
            </tr>

            <tr>
              <td className="p-2 border font-bold text-left" style={{ borderColor: "var(--border-subtle)", color: "var(--accent-emerald)" }}>
                Actual: Planet (1)
              </td>
              <td className="p-4 border font-bold"
                style={{ 
                  borderColor: "var(--border-subtle)", 
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "var(--text-primary)"
                }}>
                <div className="text-lg font-bold text-red-400">{fn}</div>
                <div className="text-[10px] opacity-70">False Neg ({fnPct}%)</div>
              </td>
              <td className="p-4 border font-bold"
                style={{ 
                  borderColor: "var(--border-subtle)", 
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "var(--text-primary)"
                }}>
                <div className="text-lg font-bold text-emerald-400">{tp}</div>
                <div className="text-[10px] opacity-70">True Pos ({tpPct}%)</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-2 text-[10px] font-telemetry flex items-center justify-between border-t"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
        <span>Grouped Isolation: No star appears in both train &amp; test</span>
        <span>Accuracy: {total > 0 ? (((tn + tp) / total) * 100).toFixed(1) : 0}%</span>
      </div>
    </div>
  );
}
