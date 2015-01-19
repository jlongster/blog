const React = require("react");
const { blockFor, filterBlocks } = require('../lib/util');
const dom = React.DOM;
const { div, a } = dom;

module.exports = React.createClass({
  displayName: "Footer",
  render: function () {
    return dom.footer(
      null,
      div(
        { className: 'footer-wrapper' },
        this.props.children,
        div(
          { className: 'footer-text' },
          dom.p(
            null,
            'Made by James Long, a devtools developer for ',
            a({ href: 'http://mozilla.org' }, 'Mozilla'),
            '. Feel free to ',
            a({ href: 'mailto:longster@gmail.com' }, 'get in touch'),
            ' with me.'
          ),
          dom.p(null, '© James Long 2012-2015')
        )
      )
    );
  }
});
