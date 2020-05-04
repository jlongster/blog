let React = require('react');

let div = React.createFactory('div');

module.exports = function AutoplayVideo({ url }) {
  return div({
    dangerouslySetInnerHTML: {
      __html: `
          <video
            loop
            muted
            autoplay
            playsinline
            src="${url}"
          >
         </video>
                `
    }
  });
};
