let React = require('react');

let div = React.createFactory('div');
let img = React.createFactory('img');

function LazyImage({ width, height, src }) {
  return div(
    {
      className:
        'lazy-image border border-gray-100 rounded relative overflow-hidden',
      ['data-width']: width,
      ['data-height']: height,
      ['data-src']: src
    },
    img({ className: 'lazy-image-content hidden' }),
    div(
      {
        className: 'loading flex items-center justify-center text-gray-200',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }
      },
      'Loading...'
    )
  );
}

module.exports = LazyImage;
