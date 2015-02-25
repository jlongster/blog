const React = require("react");
const { Element, Elements } = require('../lib/util');
const { Link } = Elements(require("react-router"));

const dom = React.DOM;
const { div, ul, li, a } = dom;

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
          li(null, a({ href: '/archive' }, 'posts')),
          li(null, a({ href: 'http://feedpress.me/jlongster' }, 'rss')),
          li(null, a({ href: 'http://twitter.com/jlongster' }, 'twitter'))
        )
      ),
      this.props.children
    );
  }
});
