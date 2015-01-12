const React = require('react');
const { Element, Elements } = require('../lib/util');
const dom = React.DOM;
const Main = Element(require('./main'));
const Header = Element(require("./header"));
const Page = Element(require('./page'));

const ServerError = React.createClass({
  displayName: 'ServerError',

  render: function () {
    return Page(null, 'An error occured on the server. Sorry!');
  }
});

module.exports = ServerError;

