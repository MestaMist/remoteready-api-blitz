/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060913",
          900: "#0b1120",
          850: "#0f172a",
          800: "#131d35",
          750: "#182442",
          700: "#1e293b",
          600: "#334155",
        },
        brand: {
          cyan: "#06b6d4",
          cyanHover: "#0891b2",
          blue: "#3b82f6",
          emerald: "#10b981",
          amber: "#f59e0b",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
