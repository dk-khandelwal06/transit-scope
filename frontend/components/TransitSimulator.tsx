"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function TransitSimulator() {
  const { chartColors, theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [transitType, setTransitType] = useState<"planet" | "binary">("planet");
  const [radiusRatio, setRadiusRatio] = useState<number>(0.15); // Rp / R*
  const [impactParam, setImpactParam] = useState<number>(0.2); // b
  const [speed, setSpeed] = useState<number>(1.0);
  const [orbitalPhase, setOrbitalPhase] = useState<number>(-0.4); // -0.5 to 0.5

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Animation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (isPlaying) {
        setOrbitalPhase((prev) => {
          let next = prev + delta * 0.12 * speed;
          if (next > 0.5) next = -0.5;
          return next;
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed]);

  // Compute geometry
  // Star center at (200, 100), radius 70 px
  const starRadius = 65;
  const starCenterX = 200;
  const starCenterY = 100;

  // Planet x position across screen (phase -0.5 -> x=20, phase 0.0 -> x=200, phase 0.5 -> x=380)
  const planetX = starCenterX + orbitalPhase * 360;
  const planetY = starCenterY + impactParam * starRadius * 0.8;
  const planetRadius = starRadius * (transitType === "binary" ? 0.32 : radiusRatio);

  // Distance from planet center to star center
  const dist = Math.hypot(planetX - starCenterX, planetY - starCenterY);
  const isInFront = orbitalPhase >= -0.25 && orbitalPhase <= 0.25;
  const isBehind = !isInFront; // phase < -0.25 or > 0.25 (secondary eclipse phase around +/-0.5)

  // Current transit dip calculation
  let currentFlux = 1.0;
  const transitDepthPpm = Math.round(Math.pow(planetRadius / starRadius, 2) * 1e6);

  if (isInFront && dist < starRadius + planetRadius) {
    // Primary transit / eclipse
    const overlapFraction = Math.max(0, Math.min(1, (starRadius + planetRadius - dist) / (2 * planetRadius)));
    const baseDepth = (transitDepthPpm * 1e-6);

    if (transitType === "binary") {
      // V-shaped grazing binary eclipse
      currentFlux = 1.0 - baseDepth * (1.0 - (dist / (starRadius + planetRadius)));
    } else {
      // U-shaped exoplanet transit with limb darkening
      const limbFactor = 1.0 - 0.15 * Math.pow(dist / starRadius, 2);
      currentFlux = 1.0 - baseDepth * overlapFraction * Math.max(0.6, limbFactor);
    }
  } else if (transitType === "binary" && isBehind) {
    // Secondary eclipse when smaller binary star passes behind larger star
    const secPhaseDist = Math.abs(Math.abs(orbitalPhase) - 0.5);
    if (secPhaseDist < 0.08) {
      const secDepth = (transitDepthPpm * 1e-6) * 0.45;
      const secOverlap = 1.0 - (secPhaseDist / 0.08);
      currentFlux = 1.0 - secDepth * secOverlap;
    }
  }

  // Pre-generate curve points for static curve display with live marker
  const curvePoints: { phase: number; flux: number }[] = [];
  for (let p = -0.5; p <= 0.5; p += 0.005) {
    let f = 1.0;
    const px = starCenterX + p * 360;
    const d = Math.hypot(px - starCenterX, planetY - starCenterY);
    if (p >= -0.25 && p <= 0.25 && d < starRadius + planetRadius) {
      const baseDepth = (transitDepthPpm * 1e-6);
      if (transitType === "binary") {
        f = 1.0 - baseDepth * (1.0 - (d / (starRadius + planetRadius)));
      } else {
        const overlap = Math.max(0, Math.min(1, (starRadius + planetRadius - d) / (2 * planetRadius)));
        const limb = 1.0 - 0.15 * Math.pow(d / starRadius, 2);
        f = 1.0 - baseDepth * overlap * Math.max(0.6, limb);
      }
    } else if (transitType === "binary") {
      const secPhaseDist = Math.abs(Math.abs(p) - 0.5);
      if (secPhaseDist < 0.08) {
        f = 1.0 - (transitDepthPpm * 1e-6) * 0.45 * (1.0 - (secPhaseDist / 0.08));
      }
    }
    curvePoints.push({ phase: p, flux: f });
  }

  // Scale curve to SVG coordinates
  // graph width 360, height 70, y ranges from 1.0 (top y=10) to minFlux (bottom y=65)
  const minFlux = Math.min(...curvePoints.map((p) => p.flux), 0.96);
  const fluxRange = Math.max(0.015, 1.0 - minFlux);
  
  const curvePathD = curvePoints.map((pt, i) => {
    const x = starCenterX + pt.phase * 360;
    const y = 10 + ((1.0 - pt.flux) / fluxRange) * 50;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  const liveMarkerX = starCenterX + orbitalPhase * 360;
  const liveMarkerY = 10 + ((1.0 - currentFlux) / fluxRange) * 50;

  return (
    <div className="instrument-panel rounded-lg p-5 border shadow-xl bg-observatory-grid">
      {/* Header telemetry and toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b"
        style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <span className="led-indicator led-cyan" />
          <span className="text-xs font-bold uppercase tracking-wider font-telemetry"
            style={{ color: "var(--text-primary)" }}>
            Orbital Transit Visualizer &bull; Live Telemetry
          </span>
        </div>

        {/* Planet vs Binary False Positive selector */}
        <div className="flex items-center gap-1.5 p-1 rounded border text-xs"
          style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-color)" }}>
          <button
            onClick={() => setTransitType("planet")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
              transitType === "planet" ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: transitType === "planet" ? "var(--bg-surface-elevated)" : "transparent",
              color: transitType === "planet" ? "var(--accent-emerald)" : "var(--text-secondary)",
              border: transitType === "planet" ? "1px solid var(--accent-emerald)" : "1px solid transparent"
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Exoplanet (U-Shape)</span>
          </button>

          <button
            onClick={() => setTransitType("binary")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
              transitType === "binary" ? "font-bold shadow-sm" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: transitType === "binary" ? "var(--bg-surface-elevated)" : "transparent",
              color: transitType === "binary" ? "var(--accent-ruby)" : "var(--text-secondary)",
              border: transitType === "binary" ? "1px solid var(--accent-ruby)" : "1px solid transparent"
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Binary Impostor (V-Shape + Sec)</span>
          </button>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded border overflow-hidden p-2"
        style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-color)" }}>
        <svg viewBox="0 0 400 240" className="w-full h-auto select-none">
          <defs>
            {/* Star radial gradient with limb darkening */}
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
              <stop offset="45%" stopColor="#FDE047" stopOpacity="1" />
              <stop offset="75%" stopColor="#EAB308" stopOpacity="0.95" />
              <stop offset="92%" stopColor="#CA8A04" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A16207" stopOpacity="0.4" />
            </radialGradient>

            {/* Star outer atmospheric corona */}
            <radialGradient id="coronaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            {/* Planet shadow gradient */}
            <radialGradient id="planetBody" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="70%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Companion star gradient for binary false positive */}
            <radialGradient id="binaryCompanion" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="70%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1={starCenterY} x2="380" y2={starCenterY} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <line x1={starCenterX} y1="20" x2={starCenterX} y2="170" stroke="var(--border-subtle)" strokeDasharray="3 3" />

          {/* Reticle coordinate labels */}
          <text x="25" y="32" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">STAR: HOST SOLAR DISK</text>
          <text x="375" y="32" textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">R_STAR = 1.0 R_SUN</text>

          {/* Star Outer Corona */}
          <circle cx={starCenterX} cy={starCenterY} r={starRadius + 18} fill="url(#coronaGlow)" />

          {/* Secondary body passing BEHIND the star (drawn first) */}
          {isBehind && (
            <circle
              cx={planetX}
              cy={planetY}
              r={planetRadius}
              fill={transitType === "binary" ? "url(#binaryCompanion)" : "url(#planetBody)"}
              opacity="0.35"
              stroke={transitType === "binary" ? "#EF4444" : "var(--accent-cyan)"}
              strokeDasharray="2 2"
            />
          )}

          {/* Stellar Disk */}
          <circle cx={starCenterX} cy={starCenterY} r={starRadius} fill="url(#starGlow)" />

          {/* Subtle star spots / granulation */}
          <circle cx={starCenterX - 22} cy={starCenterY - 14} r="3" fill="#CA8A04" opacity="0.4" />
          <circle cx={starCenterX + 18} cy={starCenterY + 22} r="4.5" fill="#CA8A04" opacity="0.35" />

          {/* Orbit path track */}
          <line
            x1="20"
            y1={planetY}
            x2="380"
            y2={planetY}
            stroke="var(--accent-cyan)"
            strokeOpacity="0.25"
            strokeWidth="1.2"
          />

          {/* Transiting Planet or Companion passing IN FRONT of star (drawn on top) */}
          {isInFront && (
            <g>
              <circle
                cx={planetX}
                cy={planetY}
                r={planetRadius}
                fill={transitType === "binary" ? "url(#binaryCompanion)" : "url(#planetBody)"}
                stroke={transitType === "binary" ? "#EF4444" : "var(--accent-cyan)"}
                strokeWidth={dist < starRadius ? "1.5" : "0.8"}
              />
              {/* Transit contact indicators */}
              {dist < starRadius && (
                <circle cx={planetX} cy={planetY} r={planetRadius + 3} fill="none" stroke="var(--accent-cyan)" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 2" />
              )}
            </g>
          )}

          {/* ======================================================== */}
          {/* LOWER PANEL: SYNCHRONIZED FLUX DIP CURVE                  */}
          {/* ======================================================== */}
          <g transform="translate(0, 160)">
            {/* Box container */}
            <rect x="20" y="5" width="360" height="65" fill="var(--bg-surface)" stroke="var(--border-subtle)" rx="3" />

            {/* Horizontal baseline 1.0 */}
            <line x1="20" y1="10" x2="380" y2="10" stroke="var(--border-strong)" strokeDasharray="2 2" />
            <text x="24" y="22" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">1.000 (Baseline)</text>

            {/* Minimum dip line */}
            <line x1="20" y1="60" x2="380" y2="60" stroke="var(--border-subtle)" strokeDasharray="1 3" />
            <text x="24" y="58" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">
              {(minFlux).toFixed(4)} (-{transitDepthPpm} ppm)
            </text>

            {/* Center transit line (phase 0.0) */}
            <line x1={starCenterX} y1="5" x2={starCenterX} y2="70" stroke="var(--accent-amber)" strokeOpacity="0.3" strokeDasharray="2 2" />
            <text x={starCenterX + 4} y="68" fill="var(--accent-amber)" fontSize="8" fontFamily="monospace">&phi; = 0.0</text>

            {/* Secondary eclipse phase markers */}
            {transitType === "binary" && (
              <>
                <line x1="20" y1="5" x2="20" y2="70" stroke="var(--accent-ruby)" strokeOpacity="0.4" strokeDasharray="1 2" />
                <line x1="380" y1="5" x2="380" y2="70" stroke="var(--accent-ruby)" strokeOpacity="0.4" strokeDasharray="1 2" />
                <text x="32" y="68" fill="var(--accent-ruby)" fontSize="7" fontFamily="monospace">Sec. Eclipse (&phi; = &plusmn;0.5)</text>
              </>
            )}

            {/* The Light Curve Dip Path */}
            <path
              d={curvePathD}
              fill="none"
              stroke={transitType === "binary" ? "#EF4444" : "var(--accent-cyan)"}
              strokeWidth="2"
            />

            {/* Live synchronized tracking cursor */}
            <circle cx={liveMarkerX} cy={liveMarkerY} r="4" fill="var(--accent-amber)" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1={liveMarkerX} y1="5" x2={liveMarkerX} y2="70" stroke="var(--accent-amber)" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="2 2" />
          </g>
        </svg>

        {/* Live numerical telemetry bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t text-[11px] font-telemetry"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div className="p-1.5 rounded" style={{ backgroundColor: "var(--bg-surface)" }}>
            <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>ORBITAL PHASE (&phi;)</span>
            <span className="font-bold text-xs" style={{ color: "var(--accent-cyan)" }}>
              {orbitalPhase.toFixed(3)}
            </span>
          </div>

          <div className="p-1.5 rounded" style={{ backgroundColor: "var(--bg-surface)" }}>
            <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>RELATIVE FLUX (F/F0)</span>
            <span className="font-bold text-xs" style={{ color: currentFlux < 0.999 ? "var(--accent-amber)" : "var(--text-primary)" }}>
              {currentFlux.toFixed(5)}
            </span>
          </div>

          <div className="p-1.5 rounded" style={{ backgroundColor: "var(--bg-surface)" }}>
            <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>TRANSIT DEPTH</span>
            <span className="font-bold text-xs" style={{ color: "var(--accent-emerald)" }}>
              {transitDepthPpm.toLocaleString()} ppm
            </span>
          </div>

          <div className="p-1.5 rounded" style={{ backgroundColor: "var(--bg-surface)" }}>
            <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>PROFILE CLASSIFICATION</span>
            <span className="font-bold text-xs" style={{ color: transitType === "planet" ? "var(--accent-emerald)" : "var(--accent-ruby)" }}>
              {transitType === "planet" ? "Planet (Flat Bottom)" : "Eclipsing Binary (V-Dip)"}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t text-xs"
        style={{ borderColor: "var(--border-subtle)" }}>
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-medium border transition-all"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)"
            }}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? "Pause Orbit" : "Resume Orbit"}</span>
          </button>

          <button
            onClick={() => { setOrbitalPhase(-0.4); setIsPlaying(true); }}
            className="p-1.5 rounded border transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-color)",
              color: "var(--text-muted)"
            }}
            title="Reset Orbit to Ingress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Orbit speed selector */}
        <div className="flex items-center gap-2 font-telemetry">
          <span style={{ color: "var(--text-muted)" }}>Speed:</span>
          {[0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded border text-[11px] ${
                speed === s ? "font-bold" : "opacity-60"
              }`}
              style={{
                backgroundColor: speed === s ? "var(--bg-surface-elevated)" : "transparent",
                borderColor: speed === s ? "var(--accent-cyan)" : "var(--border-color)",
                color: speed === s ? "var(--accent-cyan)" : "var(--text-muted)"
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Planet size slider (when in planet mode) */}
        {transitType === "planet" && (
          <div className="flex items-center gap-2 font-telemetry">
            <span style={{ color: "var(--text-muted)" }}>Radius (Rp/R*):</span>
            <input
              type="range"
              min="0.08"
              max="0.25"
              step="0.01"
              value={radiusRatio}
              onChange={(e) => setRadiusRatio(parseFloat(e.target.value))}
              className="w-24 accent-cyan-500 cursor-pointer"
            />
            <span style={{ color: "var(--accent-cyan)" }}>{radiusRatio.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

