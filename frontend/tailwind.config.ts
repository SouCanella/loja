import type { Config } from "tailwindcss";

const config: Config = {
  /**
   * Incluir `lib/` — classes canónicas (ex. `painelBtnPrimaryClass` em `lib/painel-button-classes.ts`)
   * vivem em strings; sem este glob o JIT não gera `bg-painel-cta` e os botões ficam «invisíveis» (branco/branco).
   */
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Identidade do painel de administração (primária / secundária planejadas). */
        painel: {
          primary: "#8A05BE",
          "primary-hover": "#7311a3",
          /** Botões preenchidos (Guardar, Novo pedido, etc.): mais escuro que o brand para contraste com branco */
          cta: "#5c0d73",
          "cta-hover": "#4a0a5e",
          "primary-strong": "#4a0d5c",
          soft: "#f4e9fb",
          "soft-hover": "#ebd4f7",
          border: "#e4c7f2",
          secondary: "#FFDE21",
          "secondary-hover": "#e6c81e",
          "secondary-soft": "#fff9d6",
          "on-secondary": "#1a1512",
          /** Menu lateral — tom próximo ao CTA (#5c0d73), um pouco mais claro que o fundo quase-preto */
          "sidebar-bg": "#301a3e",
          "sidebar-border": "#4a3560",
          "sidebar-text": "#f4f1f8",
          "sidebar-muted": "#9488a3",
          /** Rótulos de grupo no menu (lavanda, legível sobre fundo escuro) */
          "nav-label": "#c9b3dd",
        },
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
