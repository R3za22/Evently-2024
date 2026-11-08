import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F4F0",
        ink: "#14122B",
        indigo: { DEFAULT: "#4B3FE0", dark: "#3A2FC0", tint: "#E9E7FC" },
        marquee: "#FFB400",
        slate: "#5A5873",
        line: "#DAD7CE",
        paid: { DEFAULT: "#0B6B4A", tint: "#DDF3E9" },
        error: { DEFAULT: "#B3261E", tint: "#FBE4E1" },
        // shadcn tokens used by the sheet/separator primitives
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ring: "hsl(var(--ring))",
        border: "hsl(var(--border))",
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "DM Sans", "system-ui", "sans-serif"],
        sans: ["DM Sans", "Vazirmatn", "system-ui", "sans-serif"],
        fa: ["Vazirmatn", "DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "20px", btn: "12px", field: "8px" },
      keyframes: { shimmer: { "100%": { transform: "translateX(100%)" } } },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
