/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#F9F6F0',    // Light Sandal Cream
          card: '#F0E8DD',    // Sandalwood Card
          sidebar: '#E8DFC8', // Rich Sandalwood Sidebar
          border: '#D8CBB5',  // Sandalwood Border
          accent: '#0D9488',  // Deep Teal
          sandal: '#B4886B',  // Pure Sandalwood Accent
          brown: '#4A3525',   // Deep Espresso / Mahogany Text
          green: '#059669',   // Emerald Green
          red: '#DC2626'      // Crimson Red
        }
      }
    },
  },
  plugins: [],
}
