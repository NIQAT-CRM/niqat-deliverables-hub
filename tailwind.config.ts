import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Niqat brand — orange is the single accent
        niqat: {
          DEFAULT: "#FF6600",
          hover: "#E65C00",
          soft: "#FFF3EA",
          ring: "#FFB380",
        },
        ink: "#000000",
        muted: "#6B6B6B",
        line: "#E7E5E4",
        surface: "#FAFAF9",
      },
      fontFamily: {
        sans: ["'Manrope Variable'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
