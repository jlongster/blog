const React = require('react');
const { Element, Elements } = require('../lib/util');
const { RouteHandler, Link } = Elements(require('react-router'));
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;
const Header = Element(require('./header'));
const Main = Element(require("./main"));
const Footer = Element(require('./footer'));
const Block = Element(require('./block'));
const { blockFor } = require('../lib/util');

const dom = React.DOM;

const Page = React.createClass({
  displayName: 'Page',

  render: function() {
    return dom.div(
      { className: this.props.className },
      Header(null, blockFor('after-header', this.props.children)),
      Main(
        null,
        Block({ name: 'before-content' },
              blockFor('before-content', this.props.children)),
        this.props.children
      ),
      Footer(null, blockFor('before-footer', this.props.children))
    );
  }
});

module.exports = Page;
