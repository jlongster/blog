const React = require('react');

const dom = React.DOM;
const Main = React.createFactory(require('./main'));
const Header = React.createFactory(require("./header"));
const Page = React.createFactory(require('./page'));

const ServerError = React.createClass({
  displayName: 'ServerError',

  render: function () {
    return Page(
      null,
      'Uh oh! I wrote some bad code and things went wrong. ' +
      'I\'ll try to fix it soon. Have a great day.'
    );
  }
});

module.exports = ServerError;

