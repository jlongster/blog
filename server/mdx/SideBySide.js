let React = require('react');

let div = React.createFactory('div');

module.exports = function SideBySide({ left, right }) {
  return div(
    { className: 'sidebyside' },
    div({ className: 'left' }, left),
    div({ className: 'right' }, right)
  );
};
