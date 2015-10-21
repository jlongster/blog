const React = require("react");

const Link = React.createFactory(require('react-router').Link);
const dom = React.DOM;
const { div, a, ul, li } = dom;

module.exports = React.createClass({
  displayName: "Header",
  render: function () {
    return dom.header(
      { className: this.props.className },
      div(
        { className: 'links' },
        Link({ to: '/', className: 'home' }, 'J'),
        ul(
          null,
          li(null, Link({ to: '/archive' }, 'posts')),
          li(null, a({ href: 'http://feedpress.me/jlongster' }, 'rss')),
          li(null, a({ href: 'http://twitter.com/jlongster' }, 'twitter'))
        )
      ),
      this.props.children
    );
  }
});
