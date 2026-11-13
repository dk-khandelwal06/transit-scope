"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Compass, 
  Activity, 
  Search, 
  Cpu, 
  FileText, 
  Sun, 
  Moon, 
  Sliders, 
  Menu, 
  X,
  Radio,
  BarChart3
} from "lucide-react";
import { useTheme, Theme } from "@/lib/theme";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utcDate, setUtcDate] = useState("2026-11-13");

  useEffect(() => {
    setUtcDate(new Date().toISOString().slice(0, 10));
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Compass },
    { href: "/targets", label: "Target Explorer", icon: Search },
    { href: "/light-curve-lab", label: "Light Curve Lab", icon: Activity },
    { href: "/signal-analysis", label: "Signal Analysis", icon: BarChart3 },
    { href: "/classification-lab", label: "Classification Lab", icon: Cpu },
    { href: "/model-intelligence", label: "Model Intelligence", icon: Sliders },
    { href: "/report", label: "Analysis Report", icon: FileText },
  ];

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: "medium", label: "Medium", icon: <Sliders className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: "dark", label: "Dark", icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: "var(--bg-instrument)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Top telemetry bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 border-b text-[11px] font-telemetry"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="led-indicator led-emerald animate-pulse" />
            <span style={{ color: "var(--text-secondary)" }}>OBSERVATORY: ONLINE</span>
          </span>
          <span>&bull;</span>
          <span>NASA TAP: SYNCED</span>
          <span>&bull;</span>
          <span>TELESCOPE: TESS (SPOC 2-MIN PHOTOMETRY)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>MODEL ENGINE: GROUP-KFOLD TIC ISOLATED</span>
          <span>&bull;</span>
          <span>UTC: {utcDate}</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded overflow-hidden border p-0.5 shadow-sm"
            style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)" }}>
            <Image 
              src="/logo.png" 
              alt="Transit Scope Logo" 
              width={40} 
              height={40} 
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-astronomy text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Transit Scope
              </span>
            </div>
            <p className="text-[10px] hidden sm:block truncate max-w-[280px]" style={{ color: "var(--text-muted)" }}>
              Teaching a computer to tell a real planet from an impostor
            </p>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? "font-semibold shadow-sm"
                    : "hover:opacity-90"
                }`}
                style={{
                  backgroundColor: isActive ? "var(--bg-surface-elevated)" : "transparent",
                  color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
                  border: isActive ? "1px solid var(--border-strong)" : "1px solid transparent",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side controls: Theme selector */}
        <div className="flex items-center gap-3">
          {/* Functional 3-Theme Selector */}
          <div className="flex items-center p-0.5 rounded border shadow-inner"
            style={{ 
              backgroundColor: "var(--bg-surface)", 
              borderColor: "var(--border-color)" 
            }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`Switch to ${t.label} Mode`}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-telemetry transition-all ${
                  theme === t.id ? "shadow-sm font-semibold" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: theme === t.id ? "var(--bg-surface-elevated)" : "transparent",
                  color: theme === t.id ? "var(--text-primary)" : "var(--text-muted)",
                  border: theme === t.id ? "1px solid var(--border-color)" : "1px solid transparent"
                }}
              >
                {t.icon}
                <span className="hidden sm:inline capitalize">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded border"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden px-4 pt-2 pb-4 space-y-1 border-t"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: isActive ? "var(--bg-surface-elevated)" : "transparent",
                  color: isActive ? "var(--accent-cyan)" : "var(--text-primary)",
                  border: isActive ? "1px solid var(--border-strong)" : "none"
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
