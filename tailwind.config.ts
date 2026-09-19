import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        niqat: {
          DEFAULT: "#FF6600",
          hover: "#E65C00",
          soft: "#FFF1E8",
          tint: "rgba(255,102,0,0.16)",
        },
        ground: "#F5F4F1",
        card: "#FFFFFF",
        ink: "#1A1A18",
        muted: "#6E6E68",
        faint: "#9A9A93",
        line: "#E6E4DF",
        line2: "#F1F0EC",
        field: "#FBFBF9",
        sidebar: "#141413",
        // status badge palette
        "st-draft-bg": "#F1F0EC",
        "st-draft-fg": "#6E6E68",
        "st-locked-bg": "#EAF6EE",
        "st-locked-fg": "#177245",
        "st-edit-bg": "#FFF1E8",
        "st-edit-fg": "#FF6600",
      },
      fontFamily: {
        sans: ["'Manrope Variable'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.03)",
      },
    },
  },
  plugins: [],
};
export default config;
