/** @type {import('tailwindcss').Config} */

const { resolve } = require('path');

const glob = (p) => resolve(__dirname, p).replace(/\\/g, '/');

const screens = {
  'xs': '480px',
  'sm': '767px',
  'md': '880px',
  'lg': '1024px',
  'xl': '1366px',
  '2xl': '1500px',
  '3xl': '2400px',
};

const maxWidth = Object.fromEntries(
  Object.entries(screens).map(([key, value]) => [`screen-${key}`, value])
);

function c(cssVar, fallback) {
  return ({ opacityValue }) => opacityValue !== undefined
    ? `rgb(var(${cssVar}, ${fallback}) / ${opacityValue})`
    : `rgb(var(${cssVar}, ${fallback}))`;
}

module.exports = {
  content: [
    glob('src/**/*.ploy'),
    glob('src/**/*.liquid'),
  ],
  theme: {
    screens,
    extend: {
      colors: {
        primary: {
          DEFAULT: c('--color-primary', '24 26 32'),
          contrast: 'var(--btn-primary-text, #181A20)',
          hover: 'var(--btn-primary-hover, #CC0E3B)',
        },
        secondary: {
          DEFAULT: c('--color-secondary', '0 0 0'),
          contrast: 'var(--btn-secondary-text, #181A20)',
          hover: 'var(--btn-secondary-hover, #f5dcb3)',
          border: 'var(--btn-secondary-border, #d1d5db)',
        },
        accent: c('--color-accent', '255 235 205'),
        background: 'var(--color-background, #ffffff)',
        foreground: 'var(--color-text, #181A20)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        base: '15px',
      },
      maxWidth,
    },
  },
  plugins: [],
};
