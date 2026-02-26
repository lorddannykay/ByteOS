import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shell: "var(--shell-bg)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          muted: "var(--accent-muted)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
          muted: "var(--success-muted)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
          muted: "var(--warning-muted)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        pill: "var(--radius-pill)",
        "card-lg": "var(--radius-lg)",
        "card-xl": "var(--radius-xl)",
        shell: "var(--radius-shell)",
      },
    },
  },
  plugins: [],
};
export default config;
