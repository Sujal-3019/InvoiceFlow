/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#3B82F6",

          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },

        secondary: "#1E40AF",

        success: {
          DEFAULT: "#16A34A",
          light: "#22C55E",
          dark: "#15803D",
        },

        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },

        danger: {
          DEFAULT: "#DC2626",
          light: "#EF4444",
          dark: "#B91C1C",
        },

        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },

        // InvoiceFlow dark theme
        "dark-bg": "#111827",
        "dark-card": "#1F2937",
        "dark-border": "#374151",
      },

      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },

      fontSize: {
        hero: [
          "36px",
          {
            lineHeight: "1.2",
            fontWeight: "700",
          },
        ],

        heading: [
          "28px",
          {
            lineHeight: "1.3",
            fontWeight: "600",
          },
        ],

        section: [
          "22px",
          {
            lineHeight: "1.4",
            fontWeight: "600",
          },
        ],

        "card-title": [
          "18px",
          {
            lineHeight: "1.4",
            fontWeight: "600",
          },
        ],

        body: [
          "16px",
          {
            lineHeight: "1.5",
            fontWeight: "400",
          },
        ],

        small: [
          "14px",
          {
            lineHeight: "1.5",
            fontWeight: "400",
          },
        ],

        xs: [
          "12px",
          {
            lineHeight: "1.5",
            fontWeight: "400",
          },
        ],
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

      borderRadius: {
        "4xl": "2rem",
      },

      boxShadow: {
        soft:
          "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",

        medium:
          "0 4px 20px -2px rgba(0, 0, 0, 0.1)",

        large:
          "0 10px 40px -10px rgba(0, 0, 0, 0.15)",

        "glow-primary":
          "0 0 20px rgba(37, 99, 235, 0.3)",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow":
          "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },

        slideUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        slideIn: {
          "0%": {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
      },
    },
  },

  plugins: [],
};