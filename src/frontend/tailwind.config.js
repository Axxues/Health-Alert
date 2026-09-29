/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border-raw) / <alpha-value>)",
        input: "hsl(var(--input-raw) / <alpha-value>)",
        ring: "hsl(var(--ring-raw) / <alpha-value>)",
        background: "hsl(var(--background-raw) / <alpha-value>)",
        foreground: "hsl(var(--foreground-raw) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary-raw) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground-raw) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary-raw) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground-raw) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive-raw) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground-raw) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted-raw) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground-raw) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-raw) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground-raw) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover-raw) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground-raw) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card-raw) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground-raw) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "hsl(var(--surface-raw) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success-raw) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground-raw) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning-raw) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground-raw) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info-raw) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground-raw) / <alpha-value>)",
        },
        "sidebar-bg": "hsl(var(--sidebar-bg-raw) / <alpha-value>)",
        "sidebar-hover": "hsl(var(--sidebar-hover-raw) / <alpha-value>)",
        "sidebar-active": "hsl(var(--sidebar-active-raw) / <alpha-value>)",
        "sidebar-foreground": "hsl(var(--sidebar-foreground-raw) / <alpha-value>)",
        "card-hover": "hsl(var(--card-hover-raw) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
