/** @type {import('tailwindcss').Config} */
module.exports = {
  // Arahkan ke folder app dan components
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Menggunakan CSS Variables agar bisa diubah secara dinamis saat runtime
        primary: "var(--primary)", 
        background: "var(--background)", 
        card: "var(--card)",
        border: "var(--border)",
        muted: "var(--muted)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      }
    },
  },
  plugins: [],
}