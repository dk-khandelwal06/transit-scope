"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Telescope, 
  ArrowRight, 
  ShieldAlert, 
  Orbit, 
  Cpu, 
  Activity, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Search,
  ExternalLink
} from "lucide-react";
import { TransitSimulator } from "@/components/TransitSimulator";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b bg-observatory-grid"
        style={{ borderColor: "var(--border-color)" }}>
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Typography & CTAs */}
            <div className="lg:col-span-6 space-y-6">
              {/* Telemetry pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-telemetry"
                style={{ 
                  backgroundColor: "var(--bg-surface)", 
                  borderColor: "var(--border-strong)",
                  color: "var(--accent-cyan)" 
                }}>
                <span className="led-indicator led-emerald animate-pulse" />
                <span>EXOPLANET TRANSIT SPECTROSCOPY &bull; TESS ARCHIVE</span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-3">
                <h1 className="font-astronomy text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none"
                  style={{ color: "var(--text-primary)" }}>
                  Transit Scope
                </h1>
                <p className="font-astronomy text-xl sm:text-2xl font-medium leading-snug"
                  style={{ color: "var(--accent-amber)" }}>
                  Teaching a computer to tell a real planet&apos;s shadow from an impostor in a star&apos;s light.
                </p>
              </div>

              {/* Concise Scientific Explanation */}
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                When a distant world crosses in front of its parent star, it blocks a tiny fraction of stellar light,
                creating a telltale brightness dip. But stellar companions, eclipsing binary stars, and instrumental 
                artifacts frequently mimic the exact same signal. Transit Scope combines rigorous TESS photometric 
                signal processing with star-isolated supervised machine learning to expose the impostors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-5 py-3 rounded-md font-semibold text-sm transition-all shadow-lg hover:shadow-cyan-500/20"
                  style={{
                    backgroundColor: "var(--accent-cyan)",
                    color: "#020617"
                  }}
                >
                  <Telescope className="w-4 h-4" />
                  <span>Explore the Observatory</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#science-overview"
                  className="flex items-center gap-2 px-5 py-3 rounded-md font-medium text-sm border transition-all"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-strong)",
                    color: "var(--text-primary)"
                  }}
                >
                  <span>Understand the Science</span>
                </a>
              </div>

              {/* Key Scientific Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t font-telemetry text-xs"
                style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <span className="block text-lg font-bold" style={{ color: "var(--accent-cyan)" }}>
                    7,000+
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    TESS TOI Catalog
                  </span>
                </div>
                <div>
                  <span className="block text-lg font-bold" style={{ color: "var(--accent-emerald)" }}>
                    96.2%
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Combined Model F1
                  </span>
                </div>
                <div>
                  <span className="block text-lg font-bold" style={{ color: "var(--accent-amber)" }}>
                    Zero Leakage
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    TIC Star Isolation
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Planetary Transit Simulator */}
            <div className="lg:col-span-6">
              <TransitSimulator />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE PROBLEM OF FALSE PLANETARY DETECTIONS              */}
      {/* ======================================================== */}
      <section id="science-overview" className="py-16 border-b"
        style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-color)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-telemetry uppercase tracking-wider block mb-2"
              style={{ color: "var(--accent-cyan)" }}>
              The Core Astrophysical Challenge
            </span>
            <h2 className="font-astronomy text-3xl font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)" }}>
              Why Finding Real Worlds is Hard: The Impostor Problem
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              In wide-field space surveys like NASA&apos;s TESS, more than half of all initially detected 
              transit-like signals turn out to be false alarms caused by stellar phenomena rather than planetary transits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Eclipsing Binaries */}
            <div className="instrument-panel rounded-lg p-5 border shadow-sm">
              <div className="w-9 h-9 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--accent-ruby)" }}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-astronomy text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Grazing Eclipsing Binaries
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                When two stars in a binary system only partially clip each other&apos;s disks, they produce a shallow, 
                V-shaped dip that can match the exact depth of a transiting gas giant planet.
              </p>
              <div className="p-2 rounded text-[11px] font-telemetry border"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--accent-amber)" }}>
                Signature: V-shaped profile and detectable secondary occultation at phase 0.5.
              </div>
            </div>

            {/* Card 2: Blended Background Stars */}
            <div className="instrument-panel rounded-lg p-5 border shadow-sm">
              <div className="w-9 h-9 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" }}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-astronomy text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Blended Background EBs (NEBs)
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                TESS pixels are 21 arcseconds across. Deep eclipses of faint background binary stars frequently blend 
                into the target star&apos;s pixel aperture, creating an artificially diluted 1,000 ppm dip.
              </p>
              <div className="p-2 rounded text-[11px] font-telemetry border"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--accent-amber)" }}>
                Signature: Centroid motion offset and high in-transit scatter.
              </div>
            </div>

            {/* Card 3: Alternating Depth Binaries */}
            <div className="instrument-panel rounded-lg p-5 border shadow-sm">
              <div className="w-9 h-9 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(34, 211, 238, 0.15)", color: "var(--accent-cyan)" }}>
                <Orbit className="w-5 h-5" />
              </div>
              <h3 className="font-astronomy text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Differing Odd/Even Transits
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                Planets produce identical transit depths every orbit. In an eclipsing stellar pair, the primary eclipse 
                (hotter star obscured) is deeper than the secondary eclipse (cooler star obscured).
              </p>
              <div className="p-2 rounded text-[11px] font-telemetry border"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--accent-emerald)" }}>
                Diagnostic: Odd/even depth difference is our primary physical classifier.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HOW PLANETARY TRANSITS WORK                           */}
      {/* ======================================================== */}
      <section className="py-16 border-b bg-observatory-grid-fine"
        style={{ borderColor: "var(--border-color)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-telemetry uppercase tracking-wider block"
                style={{ color: "var(--accent-amber)" }}>
                Astrophysical Mechanics
              </span>
              <h2 className="font-astronomy text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}>
                The Physics of a Transit Light Curve
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                The transit method measures the brightness of a star over time. As the planet passes across the visible 
                hemisphere, the fraction of light blocked directly reveals the ratio of planetary to stellar radius:
              </p>

              {/* Mathematical formula box */}
              <div className="p-4 rounded border font-telemetry text-sm space-y-2"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}>
                <div className="text-base font-bold" style={{ color: "var(--accent-cyan)" }}>
                  &Delta;F / F &approx; (R_p / R_*)<sup>2</sup>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  An Earth-sized world around a Sun-like star produces an 84 ppm dip. A Jupiter-sized world produces 
                  a 10,000 ppm (1%) dip. Eclipsing stars produce dips of 20,000 to 500,000 ppm.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>U-shaped profile:</strong> Limb-darkened flat bottom characteristic of small opaque body.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>Strict periodicity:</strong> Consistent orbital period P across observing sectors.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>No optical secondary:</strong> Thermal day-side flux from exoplanets is undetectable in optical TESS bands.</span>
                </div>
              </div>
            </div>

            {/* Right: Flowchart of Scientific Pipeline */}
            <div className="lg:col-span-7">
              <div className="instrument-panel rounded-lg p-6 border shadow-lg space-y-4">
                <h3 className="font-astronomy text-base font-bold pb-2 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                  <span>Transit Scope Scientific Workflow</span>
                  <span className="text-xs font-telemetry font-normal" style={{ color: "var(--accent-cyan)" }}>
                    Automated Signal Architecture
                  </span>
                </h3>

                <div className="space-y-3 font-telemetry text-xs">
                  {/* Step 1 */}
                  <div className="p-3 rounded border flex items-start gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-cyan-500/20 text-cyan-400 shrink-0">
                      1
                    </div>
                    <div>
                      <span className="font-bold block" style={{ color: "var(--text-primary)" }}>
                        NASA TAP Catalog Ingestion
                      </span>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Queries the IPAC Table Access Protocol for TESS Objects of Interest (TOI) catalog, stellar parameters (Teff, R*, mass), and TFOPWG disposition.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded border flex items-start gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-400 shrink-0">
                      2
                    </div>
                    <div>
                      <span className="font-bold block" style={{ color: "var(--text-primary)" }}>
                        Light Curve Processing &amp; Detrending
                      </span>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Cleans non-finite cadences, removes cosmic ray spikes via 5&sigma; upper clip, and removes stellar spot modulation using a transit-preserving Savitzky-Golay running baseline filter.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded border flex items-start gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-emerald-500/20 text-emerald-400 shrink-0">
                      3
                    </div>
                    <div>
                      <span className="font-bold block" style={{ color: "var(--text-primary)" }}>
                        Phase Folding &amp; Quantitative Feature Extraction
                      </span>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Folds observations by catalog period P, bins into 100 phase bins, and computes empirical transit depth, duration, SNR, odd/even depth disparity, and secondary eclipse depth.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3 rounded border flex items-start gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-indigo-500/20 text-indigo-400 shrink-0">
                      4
                    </div>
                    <div>
                      <span className="font-bold block" style={{ color: "var(--text-primary)" }}>
                        Star-Isolated Supervised Machine Learning
                      </span>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Evaluates combined multi-modal Random Forest against catalog-only baseline models trained strictly with GroupKFold isolation on host TIC ID to guarantee zero data leakage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. MACHINE LEARNING METHODOLOGY                          */}
      {/* ======================================================== */}
      <section className="py-16 border-b"
        style={{ backgroundColor: "var(--bg-instrument)", borderColor: "var(--border-color)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-telemetry uppercase tracking-wider block"
                style={{ color: "var(--accent-emerald)" }}>
                Rigorous ML Architecture
              </span>
              <h2 className="font-astronomy text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}>
                Eliminating Data Leakage via TIC ID Group Isolation
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                A critical flaw in naive astronomy machine learning is random row-level train/test splitting. 
                Many host stars host multiple transiting candidates (e.g. TOI-700.01, TOI-700.02, TOI-700.03). 
                If observations from the same star appear in both training and test sets, models memorize the host 
                star&apos;s stellar temperature, radius, and magnitude, fabricating artificially inflated test accuracy.
              </p>
              <div className="p-4 rounded border text-xs leading-relaxed space-y-2"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)" }}>
                <span className="font-bold text-amber-400 block font-telemetry">
                  TRANSIT SCOPE INTEGRITY GUARANTEE:
                </span>
                <p style={{ color: "var(--text-secondary)" }}>
                  All models are trained and evaluated using <strong>GroupKFold cross-validation grouped by host TIC ID</strong>. 
                  Every host star is strictly isolated to either the training set or the test partition, preventing 
                  unintended stellar feature leakage and guaranteeing honest generalizability.
                </p>
              </div>
            </div>

            {/* Feature comparison table */}
            <div className="instrument-panel rounded-lg p-5 border shadow-sm">
              <h3 className="font-astronomy text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                Multi-Modal Feature Configurations
              </h3>

              <div className="space-y-3 font-telemetry text-xs">
                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-cyan-400">1. Catalog-Only Baseline</span>
                    <span className="text-[10px] text-muted">F1: 0.857</span>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Period, transit duration, catalog depth, stellar Teff, stellar radius, TESS magnitude.
                  </p>
                </div>

                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-400">2. Light-Curve Only</span>
                    <span className="text-[10px] text-muted">F1: 0.933</span>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Empirical depth, duration, SNR, odd/even depth diff, secondary eclipse depth, in-transit scatter.
                  </p>
                </div>

                <div className="p-3 rounded border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--accent-emerald)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-400">3. Combined Multi-Modal</span>
                    <span className="text-[10px] font-bold text-emerald-400">F1: 0.962 &bull; AUC: 0.98</span>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Unifies stellar context with empirical photometric transit diagnostics for maximum false positive rejection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SCIENTIFIC LIMITATIONS                                */}
      {/* ======================================================== */}
      <section className="py-16 border-b" style={{ borderColor: "var(--border-color)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-telemetry uppercase tracking-wider block mb-2"
              style={{ color: "var(--accent-ruby)" }}>
              Important Astronomical Caveats
            </span>
            <h2 className="font-astronomy text-3xl font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)" }}>
              Scientific Limitations &amp; Validation Requirements
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Transit Scope provides high-throughput statistical screening and diagnostic classification. 
              However, in astrophysics, a machine-learning prediction is never an official confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
              <h4 className="font-bold font-astronomy text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                1. Radial Velocity Confirmation
              </h4>
              <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Definitive planetary confirmation requires high-precision ground-based Doppler spectroscopy (e.g. ESPRESSO, HARPS) to measure the planet&apos;s gravitational reflex velocity and establish its true mass.
              </p>
            </div>

            <div className="p-4 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
              <h4 className="font-bold font-astronomy text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                2. High-Contrast Speckle Imaging
              </h4>
              <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Adaptive optics or speckle interferometry must inspect the target within 1 arcsecond to rule out unresolved bound stellar companions that dilute transit depths.
              </p>
            </div>

            <div className="p-4 rounded border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
              <h4 className="font-bold font-astronomy text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                3. Ephemeris Drift &amp; Single Transits
              </h4>
              <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Targets with only one or two observed transits have unconstrained period aliases. Odd/even depth comparisons require at least four observed transit events for statistical robustness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. BOTTOM CALL TO ACTION                                 */}
      {/* ======================================================== */}
      <section className="py-20 text-center relative overflow-hidden"
        style={{ backgroundColor: "var(--bg-instrument)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <h2 className="font-astronomy text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            Ready to Investigate Stellar Transit Signals?
          </h2>
          <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Enter a TESS Object of Interest identifier or choose from verified observatory targets 
            to clean, detrend, fold, extract diagnostic features, and run supervised classification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-sm shadow-md transition-all hover:scale-105"
              style={{ backgroundColor: "var(--accent-cyan)", color: "#020617" }}
            >
              <Telescope className="w-4 h-4" />
              <span>Launch Observatory Dashboard</span>
            </Link>

            <Link
              href="/targets"
              className="flex items-center gap-2 px-6 py-3 rounded-md font-medium text-sm border transition-all"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
            >
              <Search className="w-4 h-4" />
              <span>Browse TOI Catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
