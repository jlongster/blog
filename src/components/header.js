const React = require("react");

const dom = React.DOM;
const { div, a, ul, li } = dom;

module.exports = React.createClass({
  displayName: "Header",
  render: function () {
    return dom.header(
      { className: this.props.className },
      div(
        { className: 'links' },
        a({ href: '/', className: 'home' }, 'J'),
        ul(
          null,
          li(null, a({ href: '/archive' }, 'posts')),
          li(null, a({ href: 'http://feedpress.me/jlongster' }, 'rss')),
          li(null, a({ href: 'http://twitter.com/jlongster' }, 'twitter'))
        )
      ),
      this.props.children
    );
  }
});
