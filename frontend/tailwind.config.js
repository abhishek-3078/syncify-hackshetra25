/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          primary: "#1DB954",
          secondary: "#191414",
          light: "#b3b3b3",
        },
      },
    },
    plugins: [],
  };
  