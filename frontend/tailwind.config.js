/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4C6EF5',
                    600: '#3B5EE5',
                    foreground: '#ffffff',
                },
                app: '#f8f9fb',
            },
        },
    },
    plugins: [],
};
