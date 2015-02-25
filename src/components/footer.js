const React = require("react");
const { blockFor, filterBlocks } = require('../lib/util');
const dom = React.DOM;
const { div, a } = dom;

module.exports = React.createClass({
  displayName: "Footer",
  render: function () {
    return dom.footer(
      null,
      this.props.children,
      div(
        { className: 'footer-wrapper' },
        div(
          { className: 'footer-text' },
          dom.p(
            null,
            'Written by ',
            a({ href: 'https://twitter.com/jlongster' }, 'James Long'),
            ', a developer for Mozilla. ',
            a({ href: 'mailto:longster@gmail.com' }, 'Get in touch'),
            '.'
          )
        )
      )
    );
  }
});
