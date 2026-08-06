import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Error404 brand palette — terminal-green on deep obsidian
        brand: {
          bg:      "#0a0c0f",   // near-black background
          surface: "#111418",   // card surface
          border:  "#1e2530",   // subtle border
          green:   "#00ff88",   // primary accent — phosphor green
          lime:    "#a3e635",   // secondary accent
          red:     "#ff3d5a",   // negative / sell
          amber:   "#f59e0b",   // warning
          muted:   "#4a5568",   // muted text
          text:    "#e2e8f0",   // primary text
          dim:     "#718096",   // secondary text
        },
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
        body:    ["'Inter'", "sans-serif"],
      },
      animation: {
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "ticker":      "ticker 20s linear infinite",
        "fade-in":     "fade-in 0.3s ease-out",
      },
      keyframes: {
        "pulse-green": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,255,136,0)" },
          "50%":       { boxShadow: "0 0 12px 4px rgba(0,255,136,0.25)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
