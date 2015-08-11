const React = require('react');
const csp = require('js-csp');
const { go, chan, take, put, ops } = csp;
const { blockFor } = require('../lib/util');

const dom = React.DOM;
const Header = React.createFactory(require('./header'));
const Main = React.createFactory(require("./main"));
const Footer = React.createFactory(require('./footer'));
const Block = React.createFactory(require('./block'));

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
