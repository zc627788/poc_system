/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px"
      }
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0052d9",
          soft: "#eef3fc"
        }
      }
    }
  },
  plugins: []
};
