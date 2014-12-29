const React = require('react');
const { Element, Elements } = require('../lib/react-util');
const dom = React.DOM;
const Main = Element(require('./main'));
const Header = Element(require("./header"));

const AuthError = React.createClass({
  displayName: 'AuthError',

  render: function () {
    return dom.div(
      null,
      Header(),
      Main(null, 'You must be logged in to access this page.')
    );
  }
});

module.exports = AuthError;
