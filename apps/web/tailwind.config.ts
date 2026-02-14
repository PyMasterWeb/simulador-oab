import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f4ed",
        brand: "#8f3b1f",
        ink: "#1a2430"
      }
    }
  },
  plugins: []
} satisfies Config;
