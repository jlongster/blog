const React = require("react");
const { blockFor, Element, Elements } = require('../lib/util');
const Footer = require('./footer');
const dom = React.DOM;

module.exports = React.createClass({
  displayName: "exports",
  render: function () {
    return dom.main(
      this.props,
      blockFor('before-content', this.props.children),
      dom.div({ className: "main-wrapper" },
              this.props.children)
    );
  }
});
