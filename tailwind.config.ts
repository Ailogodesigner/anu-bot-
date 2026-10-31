import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#050505",
        card: {
          DEFAULT: "#0D0D10",
          hover: "#141418",
          secondary: "#141418",
        },
        border: {
          DEFAULT: "#222226",
          subtle: "#2D2D33",
          accent: "#D4AF37",
        },
        accent: {
          DEFAULT: "#D4AF37",
          hover: "#C5A028",
          light: "#F5D061",
          glow: "rgba(212, 175, 55, 0.25)",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F5D061",
          dark: "#A1821C",
          surface: "rgba(212, 175, 55, 0.12)",
          border: "rgba(212, 175, 55, 0.28)",
        },
        foreground: "#FFFFFF",
        muted: {
          DEFAULT: "#A1A1AA",
          foreground: "#71717A",
        },
        success: {
          DEFAULT: "#D4AF37",
          foreground: "#000000",
        },
        warning: {
          DEFAULT: "#E5C158",
          foreground: "#000000",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.8), 0 1px 2px -1px rgba(0, 0, 0, 0.8)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.9)",
        glow: "0 0 25px -4px rgba(212, 175, 55, 0.35)",
        glowGold: "0 0 35px -5px rgba(229, 193, 88, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
