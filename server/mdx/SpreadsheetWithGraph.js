let React = require('react');
let { DOM } = require('react-dom');

let div = React.createFactory('div');
let iframe = React.createFactory('iframe');

function SpreadsheetWithGraph({ src, graphSrc }) {
  return div(
    { className: 'spreadsheet-with-graph ' + (graphSrc ? '' : 'alone') },

    iframe({
      className: 'spreadsheet',
      src,
      style: { height: 285 }
    }),
    graphSrc &&
      iframe({
        width: 468.19407008086256,
        height: 289.5,
        seamless: true,
        frameBorder: '0',
        scrolling: 'no',
        src: graphSrc
      })
  );
}

module.exports = SpreadsheetWithGraph;
