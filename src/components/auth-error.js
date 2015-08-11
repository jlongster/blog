const React = require('react');
const dom = React.DOM;
const Main = React.createFactory(require('./main'));
const Header = React.createFactory(require("./header"));

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
