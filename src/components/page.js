const React = require('react');
const { Element, Elements } = require('../lib/util');
const { RouteHandler, Link } = Elements(require('react-router'));
const csp = require('js-csp');
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
    let extraHeader = blockFor('after-header', this.props.children);

    return dom.div(
      { className: this.props.className,
        id: this.props.id },
      Header(
        { className: extraHeader ? 'collapse' : '' },
        extraHeader
      ),
      Main(
        null,
        Block({ name: 'before-content' },
              blockFor('before-content', this.props.children)),
        this.props.children
      ),
      blockFor('before-footer', this.props.children),
      Footer()
    );
  }
});

module.exports = Page;
