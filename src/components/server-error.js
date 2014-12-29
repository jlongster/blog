const React = require('react');
const { Element, Elements } = require('../lib/react-util');
const dom = React.DOM;
const Main = Element(require('./main'));
const Header = Element(require("./header"));

const ServerError = React.createClass({
  displayName: 'ServerError',

  render: function () {
    return dom.div(
      null,
      Header(),
      Main(null, 'An error occured on the server. Sorry!')
    );
  }
});

module.exports = ServerError;

