module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px'
    },
    fontFamily: {
      display: ['Unica One'],
      body: [
        'Open Sans',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji'
      ]
    },
    extend: {
      colors: {
        gray: {
          100: '#F3F2F7',
          200: '#C4C2CC',
          300: '#A6A1B2',
          400: '#6D6678',
          500: '#2B272F'
        },
        'dark-text': '#443b4e',
        'dark-border': '#433e4a'
      }
    }
  }
};
