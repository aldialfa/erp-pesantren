import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 700: "#1c3a63", 800: "#142b4d", 900: "#0d1f3a" },
        gold: { 400: "#d4af5a", 500: "#b8913a" },
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
