/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./types/**/*.{js,ts,tsx}"
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        pill: "999px"
      },
      colors: {
        background: {
          DEFAULT: "#f7f7fb",
          muted: "#eef0f8",
          dark: "#0f111a"
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#fafbff",
          dark: "#161922"
        },
        border: {
          DEFAULT: "#e3e5ef",
          strong: "#d2d6e4",
          dark: "#262937"
        },
        accent: {
          blue: "#3b82f6",
          violet: "#7c3aed",
          amber: "#f59e0b",
          teal: "#14b8a6"
        }
      },
      boxShadow: {
        sm: "0 6px 20px rgba(15, 23, 42, 0.05)",
        md: "0 18px 40px rgba(15, 23, 42, 0.12)"
      },
      spacing: {
        18: "4.5rem"
      },
      fontFamily: {
        inter: ["Inter", "System", "sans-serif"]
      }
    }
  },
  plugins: []
};