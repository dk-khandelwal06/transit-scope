"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "medium" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  chartColors: {
    background: string;
    surface: string;
    text: string;
    grid: string;
    accent: string;
    rawLine: string;
    cleanLine: string;
    flatLine: string;
    foldedPoints: string;
    binnedLine: string;
    modelFit: string;
    planet: string;
    falsePositive: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("transit_scope_theme") as Theme | null;
      if (stored === "light" || stored === "medium" || stored === "dark") {
        setThemeState(stored);
        document.documentElement.setAttribute("data-theme", stored);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);
      }
    } catch {
      // Fallback
      document.documentElement.setAttribute("data-theme", "dark");
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("transit_scope_theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  };

  // Theme-adaptive color palettes for SVG and Canvas charts
  const chartColors = {
    light: {
      background: "#F7F4EE",
      surface: "#EFE9DD",
      text: "#1C1F26",
      grid: "rgba(0, 0, 0, 0.08)",
      accent: "#B45309",
      rawLine: "#94A3B8",
      cleanLine: "#0284C7",
      flatLine: "#2563EB",
      foldedPoints: "rgba(100, 116, 139, 0.45)",
      binnedLine: "#B45309",
      modelFit: "#DC2626",
      planet: "#059669",
      falsePositive: "#DC2626"
    },
    medium: {
      background: "#1E2530",
      surface: "#2A3444",
      text: "#F1F5F9",
      grid: "rgba(255, 255, 255, 0.10)",
      accent: "#F59E0B",
      rawLine: "#64748B",
      cleanLine: "#38BDF8",
      flatLine: "#60A5FA",
      foldedPoints: "rgba(148, 163, 184, 0.50)",
      binnedLine: "#F59E0B",
      modelFit: "#EF4444",
      planet: "#10B981",
      falsePositive: "#EF4444"
    },
    dark: {
      background: "#080C14",
      surface: "#0F172A",
      text: "#E2E8F0",
      grid: "rgba(34, 211, 238, 0.08)",
      accent: "#22D3EE",
      rawLine: "#475569",
      cleanLine: "#06B6D4",
      flatLine: "#38BDF8",
      foldedPoints: "rgba(100, 116, 139, 0.55)",
      binnedLine: "#F59E0B",
      modelFit: "#F43F5E",
      planet: "#34D399",
      falsePositive: "#F87171"
    }
  }[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, chartColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
