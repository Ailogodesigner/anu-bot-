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
        background: "#080B11",
        card: {
          DEFAULT: "#0F1523",
          hover: "#151E30",
          secondary: "#151E30",
        },
        border: {
          DEFAULT: "#1A2438",
          subtle: "#222F47",
          accent: "#00F2FE",
        },
        accent: {
          DEFAULT: "#00F2FE",
          hover: "#06B6D4",
          light: "#00F5D4",
          glow: "rgba(0, 242, 254, 0.2)",
        },
        foreground: "#F8FAFC",
        muted: {
          DEFAULT: "#94A3B8",
          foreground: "#64748B",
        },
        success: {
          DEFAULT: "#00F5D4",
          foreground: "#080B11",
        },
        warning: {
          DEFAULT: "#00F2FE",
          foreground: "#080B11",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FEF2F2",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.7)",
        glow: "0 0 25px -5px rgba(0, 242, 254, 0.3)",
        glowCyan: "0 0 25px -5px rgba(0, 245, 212, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
