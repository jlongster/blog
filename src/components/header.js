const React = require("react");
const { Element, Elements } = require("../lib/react-util");
const { Link } = Elements(require("react-router"));
const { blockFor, filterBlocks } = require('../lib/util');

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
