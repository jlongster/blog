module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')
    // ...(process.env.NODE_ENV === 'production'
    //   ? [
    //       require('@fullhuman/postcss-purgecss')({
    //         content: ['./templates/**/*'],
    //         defaultExtractor: content =>
    //           content.match(/[A-Za-z0-9-_:/]+/g) || []
    //       })
    //     ]
    //   : [])
  ]
};
