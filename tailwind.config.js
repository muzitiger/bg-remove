/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#257bf4",
        "background-light": "#f5f7f8",
        "background-dark": "#101722",
        surface: {
          DEFAULT: "#f5f7f8",
          1: "#ffffff",
          2: "#f0f2f4",
          3: "#e5e7eb",
          4: "#d1d5db",
        },
        on: {
          surface: "#0f172a",
          "surface-dim": "#64748b",
          "surface-faint": "#94a3b8",
        },
        accent: {
          DEFAULT: "#257bf4",
          hover: "#1d6ad8",
          dim: "rgba(37, 123, 244, 0.1)",
          ring: "rgba(37, 123, 244, 0.35)",
        },
        danger: {
          DEFAULT: "#ef4444",
          dim: "rgba(239, 68, 68, 0.1)",
        },
        success: {
          DEFAULT: "#22c55e",
          dim: "rgba(34, 197, 94, 0.1)",
        },
        border: {
          DEFAULT: "#e2e8f0",
          hover: "#cbd5e1",
        },
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.12)",
        glow: "0 0 24px rgba(37, 123, 244, 0.2)",
        modal: "0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
