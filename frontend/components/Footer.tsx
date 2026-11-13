"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Telescope, ExternalLink, ShieldCheck, Database, Award } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t mt-auto text-xs"
      style={{
        backgroundColor: "var(--bg-instrument)",
        borderColor: "var(--border-color)",
        color: "var(--text-secondary)"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border p-0.5"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)" }}>
                <Image 
                  src="/logo.png" 
                  alt="Transit Scope Logo" 
                  width={32} 
                  height={32} 
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="font-astronomy text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Transit Scope
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--accent-amber)" }}>
              Teaching a computer to tell a real planet&apos;s shadow from an impostor in a star&apos;s light.
            </p>
            <p className="text-xs leading-relaxed max-w-md" style={{ color: "var(--text-muted)" }}>
              A scientific application for astronomical time-series analysis and supervised machine-learning 
              classification of TESS Objects of Interest (TOI). Distinguishes genuine exoplanetary transits from 
              astrophysical false positives using star-isolated GroupKFold models.
            </p>
          </div>

          {/* Scientific navigation */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-primary)" }}>
              Observatory Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:underline flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  Observatory Dashboard
                </Link>
              </li>
              <li>
                <Link href="/targets" className="hover:underline flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  Target Explorer (TAP Catalog)
                </Link>
              </li>
              <li>
                <Link href="/light-curve-lab" className="hover:underline flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  Light Curve Lab
                </Link>
              </li>
              <li>
                <Link href="/signal-analysis" className="hover:underline flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  Signal Analysis &amp; Features
                </Link>
              </li>
              <li>
                <Link href="/classification-lab" className="hover:underline flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  Classification Lab
                </Link>
              </li>
              <li>
                <Link href="/model-intelligence" className="hover:underline flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  Model Intelligence &amp; Metrics
                </Link>
              </li>
            </ul>
          </div>

          {/* Astronomical citations & data */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-primary)" }}>
              Data &amp; References
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://exoplanetarchive.ipac.caltech.edu/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>NASA Exoplanet Archive TAP</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              </li>
              <li>
                <a 
                  href="https://archive.stsci.edu/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Telescope className="w-3 h-3 text-amber-400" />
                  <span>Mikulski Archive (MAST)</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              </li>
              <li>
                <a 
                  href="https://tess.mit.edu/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>NASA TESS Mission</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.lightkurve.org/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Award className="w-3 h-3 text-indigo-400" />
                  <span>Lightkurve Astrophotometry</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          <p>
            &copy; 2026 Transit Scope. Built for astronomical research and exoplanet transit signal classification.
          </p>
          <p className="max-w-xl text-center sm:text-right italic">
            Statistical classification output is for diagnostic screening only and does not constitute official TFOP radial velocity validation.
          </p>
        </div>
      </div>
    </footer>
  );
}
