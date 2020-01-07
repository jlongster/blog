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
      div(
        { className: 'graph-container' },
        iframe({
          className: 'graph',
          seamless: true,
          frameBorder: '0',
          scrolling: 'no',
          src: graphSrc
        })
      )
  );
}

module.exports = SpreadsheetWithGraph;
