/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "health-red": "#dc2626", // Used for RAG status
        "health-amber": "#f59e0b", // Used for RAG status
        "health-green": "#10b981", // Used for RAG status
        "health-blue": "#0000A3", // Used for RAG status
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
