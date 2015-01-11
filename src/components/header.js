const React = require("react");
const { Element, Elements } = require('../lib/util');
const { Link } = Elements(require("react-router"));

const dom = React.DOM;

module.exports = React.createClass({
  displayName: "Header",
  render: function () {
    return dom.header(
      null,
      dom.div({ className: 'titlebar' },
              Link({ to: '/' }, 'The Blog of James Long')),
      this.props.children
    );
  }
});
