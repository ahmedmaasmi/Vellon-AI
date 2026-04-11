import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        handwriting: ["var(--font-handwriting)", "cursive"],
      },
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        border: "rgb(var(--border))",
        divider: "rgb(var(--divider))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
      },
      boxShadow: {
        "primary/10": "0 1px 2px 0 rgb(var(--primary) / 0.1)",
        "primary/20": "0 4px 6px -1px rgb(var(--primary) / 0.2), 0 2px 4px -2px rgb(var(--primary) / 0.2)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        elevated: "var(--shadow-elevated)",
        "panel-depth":
          "inset 6px 0 12px -8px rgb(var(--primary) / 0.08)",
        "search-inset":
          "inset 0 1px 2px rgb(var(--primary) / 0.06), inset 0 0 0 1px rgb(var(--border) / 0.5)",
        "glow-secondary":
          "0 0 0 1px rgb(var(--secondary) / 0.15), 0 8px 24px rgb(var(--secondary) / 0.2)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
