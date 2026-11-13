"use client";

import React, { useState, useMemo, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Eye, Info, Layers } from "lucide-react";
import { useTheme } from "@/lib/theme";

export interface DataPoint {
  x: number;
  y: number;
  err?: number | null;
  phase?: number | null;
}

export interface BinnedPoint {
  phase: number;
  flux: number;
  error?: number | null;
  model_fit?: number | null;
}

interface ScientificChartProps {
  title: string;
  subtitle?: string;
  description: string;
  dataPoints: DataPoint[];
  binnedPoints?: BinnedPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
  chartType: "raw" | "cleaned" | "flattened" | "folded";
  highlightWindow?: { min: number; max: number };
}

export function ScientificChart({
  title,
  subtitle,
  description,
  dataPoints,
  binnedPoints,
  xAxisLabel,
  yAxisLabel,
  chartType,
  highlightWindow
}: ScientificChartProps) {
  const { chartColors, theme } = useTheme();
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; valX: number; valY: number } | null>(null);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showBinned, setShowBinned] = useState<boolean>(true);
  const [showModel, setShowModel] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // SVG Dimensions & Margins
  const width = 800;
  const height = 340;
  const margin = { top: 25, right: 30, bottom: 50, left: 75 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Domain computation
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0.99, yMax: 1.01 };
    }
    const xs = dataPoints.map((d) => d.x);
    const ys = dataPoints.map((d) => d.y);

    let rawXMin = Math.min(...xs);
    let rawXMax = Math.max(...xs);
    let rawYMin = Math.min(...ys);
    let rawYMax = Math.max(...ys);

    // Add 4% padding to y-axis for readability
    const yPad = (rawYMax - rawYMin) * 0.05 || 0.002;
    rawYMin -= yPad;
    rawYMax += yPad;

    // Apply zoom & pan
    const xSpan = (rawXMax - rawXMin) / zoomLevel;
    const ySpan = (rawYMax - rawYMin) / zoomLevel;

    const xCenter = (rawXMin + rawXMax) / 2 + panOffset.x * (rawXMax - rawXMin);
    const yCenter = (rawYMin + rawYMax) / 2 + panOffset.y * (rawYMax - rawYMin);

    return {
      xMin: xCenter - xSpan / 2,
      xMax: xCenter + xSpan / 2,
      yMin: yCenter - ySpan / 2,
      yMax: yCenter + ySpan / 2
    };
  }, [dataPoints, zoomLevel, panOffset]);

  // Coordinate projection functions
  const scaleX = (x: number) => {
    if (xMax === xMin) return margin.left + innerWidth / 2;
    return margin.left + ((x - xMin) / (xMax - xMin)) * innerWidth;
  };

  const scaleY = (y: number) => {
    if (yMax === yMin) return margin.top + innerHeight / 2;
    return margin.top + (1 - (y - yMin) / (yMax - yMin)) * innerHeight;
  };

  // Generate grid ticks
  const xTicks = useMemo(() => {
    const ticks = [];
    const count = 7;
    for (let i = 0; i <= count; i++) {
      const val = xMin + (i / count) * (xMax - xMin);
      ticks.push(val);
    }
    return ticks;
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const val = yMin + (i / count) * (yMax - yMin);
      ticks.push(val);
    }
    return ticks;
  }, [yMin, yMax]);

  // Color scheme based on chart type
  const lineColor = useMemo(() => {
    if (chartType === "raw") return chartColors.rawLine;
    if (chartType === "cleaned") return chartColors.cleanLine;
    if (chartType === "flattened") return chartColors.flatLine;
    return chartColors.binnedLine;
  }, [chartType, chartColors]);

  // SVG Line path string for continuous line (raw/cleaned/flattened)
  const linePath = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0 || chartType === "folded") return "";
    return dataPoints.map((d, i) => {
      const px = scaleX(d.x);
      const py = scaleY(d.y);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ");
  }, [dataPoints, xMin, xMax, yMin, yMax, chartType]);

  // SVG Path for binned points (in folded chart)
  const binnedPath = useMemo(() => {
    if (!binnedPoints || binnedPoints.length === 0) return "";
    return binnedPoints.map((b, i) => {
      const px = scaleX(b.phase);
      const py = scaleY(b.flux);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ");
  }, [binnedPoints, xMin, xMax, yMin, yMax]);

  // SVG Path for theoretical transit model fit
  const modelPath = useMemo(() => {
    if (!binnedPoints || binnedPoints.length === 0) return "";
    return binnedPoints.map((b, i) => {
      const fit = b.model_fit !== undefined && b.model_fit !== null ? b.model_fit : 1.0;
      const px = scaleX(b.phase);
      const py = scaleY(fit);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ");
  }, [binnedPoints, xMin, xMax, yMin, yMax]);

  const handleZoom = (factor: number) => {
    setZoomLevel((prev) => Math.min(10.0, Math.max(0.8, prev * factor)));
  };

  const handleReset = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setHoveredPoint(null);
  };

  return (
    <div className="instrument-panel rounded-lg p-4 border shadow-md relative">
      {/* Top chart title & telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b"
        style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`led-indicator ${chartType === 'folded' ? 'led-amber' : 'led-cyan'}`} />
            <h3 className="font-astronomy text-sm font-bold uppercase tracking-wide"
              style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            {subtitle && (
              <span className="text-xs font-telemetry" style={{ color: "var(--text-muted)" }}>
                &bull; {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar: Zoom, Reset, Layers, Info */}
        <div className="flex items-center gap-1.5 text-xs font-telemetry">
          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(1.4)}
            className="p-1 rounded border hover:opacity-100 transition-all"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.7)}
            className="p-1 rounded border hover:opacity-100 transition-all"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded border hover:opacity-100 transition-all"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Folded chart layer toggles */}
          {chartType === "folded" && (
            <>
              <button
                onClick={() => setShowPoints(!showPoints)}
                className={`px-2 py-0.5 rounded border text-[11px] ${showPoints ? 'font-bold' : 'opacity-40'}`}
                style={{
                  backgroundColor: showPoints ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)"
                }}
                title="Toggle Photometric Points"
              >
                Points
              </button>
              <button
                onClick={() => setShowBinned(!showBinned)}
                className={`px-2 py-0.5 rounded border text-[11px] ${showBinned ? 'font-bold' : 'opacity-40'}`}
                style={{
                  backgroundColor: showBinned ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: "var(--border-color)",
                  color: chartColors.binnedLine
                }}
                title="Toggle Binned Curve"
              >
                Binned
              </button>
              <button
                onClick={() => setShowModel(!showModel)}
                className={`px-2 py-0.5 rounded border text-[11px] ${showModel ? 'font-bold' : 'opacity-40'}`}
                style={{
                  backgroundColor: showModel ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: "var(--border-color)",
                  color: chartColors.modelFit
                }}
                title="Toggle Transit Fit Model"
              >
                Model
              </button>
            </>
          )}

          {/* Explanation button */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={`p-1 rounded border transition-all ${showExplanation ? 'bg-amber-500/20 text-amber-400' : ''}`}
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-muted)" }}
            title="Toggle Scientific Explanation"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Scientific Explanation */}
      {showExplanation && (
        <div className="mb-3 p-3 rounded text-xs border leading-relaxed animate-in fade-in"
          style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
          <p className="font-semibold mb-1" style={{ color: "var(--accent-amber)" }}>
            ASTRONOMICAL SIGNAL PIPELINE: {title}
          </p>
          <p>{description}</p>
        </div>
      )}

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden select-none" style={{ backgroundColor: "var(--bg-instrument)" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Clip path for zoom bounds */}
          <defs>
            <clipPath id={`chartClip-${chartType}`}>
              <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} />
            </clipPath>
          </defs>

          {/* Measurement Grid Lines */}
          <g className="grid-lines">
            {/* Vertical grid lines */}
            {xTicks.map((tick, i) => (
              <line
                key={`v-${i}`}
                x1={scaleX(tick)}
                y1={margin.top}
                x2={scaleX(tick)}
                y2={height - margin.bottom}
                stroke="var(--grid-pattern)"
                strokeWidth="1"
              />
            ))}
            {/* Horizontal grid lines */}
            {yTicks.map((tick, i) => (
              <line
                key={`h-${i}`}
                x1={margin.left}
                y1={scaleY(tick)}
                x2={width - margin.right}
                y2={scaleY(tick)}
                stroke="var(--grid-pattern)"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Baseline reference (1.000 flux) */}
          {yMin <= 1.0 && yMax >= 1.0 && (
            <line
              x1={margin.left}
              y1={scaleY(1.0)}
              x2={width - margin.right}
              y2={scaleY(1.0)}
              stroke="var(--border-strong)"
              strokeDasharray="4 3"
              strokeWidth="1.2"
            />
          )}

          {/* Phase 0.0 vertical reference for folded curve */}
          {chartType === "folded" && xMin <= 0.0 && xMax >= 0.0 && (
            <line
              x1={scaleX(0.0)}
              y1={margin.top}
              x2={scaleX(0.0)}
              y2={height - margin.bottom}
              stroke="var(--accent-amber)"
              strokeOpacity="0.4"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
          )}

          {/* Clipped Data Drawing Area */}
          <g clipPath={`url(#chartClip-${chartType})`}>
            {/* For folded chart: scatter points */}
            {chartType === "folded" && showPoints && (
              <g className="scatter-points">
                {dataPoints.map((pt, i) => {
                  const px = scaleX(pt.x);
                  const py = scaleY(pt.y);
                  return (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r="1.4"
                      fill={chartColors.foldedPoints}
                      opacity="0.65"
                      className="cursor-pointer hover:r-3 hover:fill-amber-400"
                      onMouseEnter={() => setHoveredPoint({ x: px, y: py, valX: pt.x, valY: pt.y })}
                    />
                  );
                })}
              </g>
            )}

            {/* Continuous line for raw, cleaned, flattened */}
            {chartType !== "folded" && linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={chartType === "flattened" ? "1.6" : "1.2"}
                strokeOpacity={chartType === "raw" ? 0.75 : 0.95}
              />
            )}

            {/* In folded chart: Binned Curve */}
            {chartType === "folded" && showBinned && binnedPath && (
              <path
                d={binnedPath}
                fill="none"
                stroke={chartColors.binnedLine}
                strokeWidth="2.2"
              />
            )}

            {/* In folded chart: Binned Points & Error Bars */}
            {chartType === "folded" && showBinned && binnedPoints && (
              <g className="binned-points">
                {binnedPoints.map((b, i) => {
                  const px = scaleX(b.phase);
                  const py = scaleY(b.flux);
                  const errY = b.error ? (scaleY(b.flux - b.error) - py) : 0;
                  return (
                    <g key={i}>
                      {b.error && (
                        <line
                          x1={px}
                          y1={py - errY}
                          x2={px}
                          y2={py + errY}
                          stroke={chartColors.binnedLine}
                          strokeWidth="1"
                          opacity="0.6"
                        />
                      )}
                      <circle
                        cx={px}
                        cy={py}
                        r="2.8"
                        fill={chartColors.binnedLine}
                        stroke="var(--bg-instrument)"
                        strokeWidth="1"
                        className="cursor-pointer hover:scale-150"
                        onMouseEnter={() => setHoveredPoint({ x: px, y: py, valX: b.phase, valY: b.flux })}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* In folded chart: Theoretical Model Fit */}
            {chartType === "folded" && showModel && modelPath && (
              <path
                d={modelPath}
                fill="none"
                stroke={chartColors.modelFit}
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
            )}
          </g>

          {/* Axes */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />

          {/* X Ticks & Labels */}
          {xTicks.map((tick, i) => (
            <g key={`xtick-${i}`} transform={`translate(${scaleX(tick)}, ${height - margin.bottom})`}>
              <line y1="0" y2="4" stroke="var(--border-strong)" />
              <text
                y="18"
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="9"
                fontFamily="monospace"
              >
                {chartType === "folded" ? tick.toFixed(2) : tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Y Ticks & Labels */}
          {yTicks.map((tick, i) => (
            <g key={`ytick-${i}`} transform={`translate(${margin.left}, ${scaleY(tick)})`}>
              <line x1="-4" x2="0" stroke="var(--border-strong)" />
              <text
                x="-8"
                y="3"
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="9"
                fontFamily="monospace"
              >
                {tick.toFixed(4)}
              </text>
            </g>
          ))}

          {/* Axis Titles */}
          <text
            x={margin.left + innerWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {xAxisLabel}
          </text>

          <text
            transform={`rotate(-90)`}
            x={-(margin.top + innerHeight / 2)}
            y="20"
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {yAxisLabel}
          </text>

          {/* Hover Telemetry Pointer */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y})`}>
              <circle r="4" fill="none" stroke="var(--accent-amber)" strokeWidth="2" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--accent-amber)" strokeWidth="1" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="var(--accent-amber)" strokeWidth="1" />
              <rect
                x="8"
                y="-25"
                width="140"
                height="32"
                fill="var(--bg-surface)"
                stroke="var(--border-strong)"
                rx="3"
              />
              <text x="14" y="-14" fill="var(--text-primary)" fontSize="9" fontFamily="monospace">
                X: {hoveredPoint.valX.toFixed(4)}
              </text>
              <text x="14" y="-2" fill="var(--accent-cyan)" fontSize="9" fontFamily="monospace">
                Flux: {hoveredPoint.valY.toFixed(5)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend & Telemetry stats footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t text-[11px] font-telemetry"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
        <div className="flex items-center gap-4">
          {chartType === "folded" ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors.foldedPoints }} />
                <span>Observed Points</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1" style={{ backgroundColor: chartColors.binnedLine }} />
                <span>Phase Binned (100 bins)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 border-b border-dashed" style={{ borderColor: chartColors.modelFit }} />
                <span>Transit Model Fit</span>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1" style={{ backgroundColor: lineColor }} />
              <span>Photometric Time Series</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>Cadences: {dataPoints.length}</span>
          <span>&bull;</span>
          <span>Zoom: {zoomLevel.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}

