const React = require("react");
const { Element, Elements } = require("../lib/react-util");
const { blockFor } = require('../lib/util');
const Footer = require('./footer');
const dom = React.DOM;

module.exports = React.createClass({
  displayName: "exports",
  render: function () {
    return dom.main(
      null,
      blockFor('before-content', this.props.children),
      dom.div({ className: "main-wrapper clearfix" },
              this.props.children)
    );
  }
});
