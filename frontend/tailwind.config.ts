import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        loja: {
          bg: "#faf6f2",
          surface: "#ffffff",
          ink: "#1a1512",
          muted: "#5c4d42",
          /** Identidade (gradientes suaves) — override via `--loja-primary-rgb` em `vitrineThemeStyle`. */
          primary:
            "rgb(var(--loja-primary-rgb, 15 118 110) / <alpha-value>)",
          /** Destaques — override via `--loja-accent-rgb`. */
          accent: "rgb(var(--loja-accent-rgb, 184 69 46) / <alpha-value>)",
          accentSoft:
            "rgb(var(--loja-accent-soft-rgb, 252 238 233) / <alpha-value>)",
          whatsapp: "#128c7e",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans,ui-sans-serif)",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-fraunces,Georgia)", "Times New Roman", "serif"],
      },
      boxShadow: {
        loja: "0 8px 32px rgba(26, 21, 18, 0.07)",
        "loja-bar": "0 4px 20px rgba(26, 21, 18, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
