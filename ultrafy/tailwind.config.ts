import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf6",
          100: "#e3f7ea",
          200: "#c3ecd2",
          300: "#93dbb0",
          400: "#5cc389",
          500: "#34a968",
          600: "#248a53",
          700: "#1e6e44",
          800: "#1c5738",
          900: "#18482f",
          950: "#0f3320",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(52, 169, 104, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
