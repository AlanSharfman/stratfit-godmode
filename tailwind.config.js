/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stratfitBg: "#0a0f1a",
        neonCyan: "#00f2ff",
        neonCyanBright: "#5cffff",
        neonMagenta: "#b200ff",
        neonMagentaBright: "#d946ef",
        neonPurple: "#8b5cf6",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

