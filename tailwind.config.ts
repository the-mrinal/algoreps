import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        neon: {
          cyan: "#00fff2",
          green: "#39ff14",
          purple: "#bf5af2",
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 15px rgba(0, 255, 242, 0.35), 0 0 40px rgba(0, 255, 242, 0.1)",
        "glow-green": "0 0 15px rgba(57, 255, 20, 0.35), 0 0 40px rgba(57, 255, 20, 0.1)",
        "glow-purple": "0 0 15px rgba(191, 90, 242, 0.35), 0 0 40px rgba(191, 90, 242, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
