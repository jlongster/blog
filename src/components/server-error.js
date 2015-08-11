const React = require('react');

const dom = React.DOM;
const Main = React.createFactory(require('./main'));
const Header = React.createFactory(require("./header"));
const Page = React.createFactory(require('./page'));

const ServerError = React.createClass({
  displayName: 'ServerError',

  render: function () {
    return Page(null, 'An error occured on the server. Sorry!');
  }
});

module.exports = ServerError;

