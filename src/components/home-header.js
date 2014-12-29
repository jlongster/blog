var React = require("react");
const { Element, Elements } = require("../lib/react-util");

var dom = React.DOM;

module.exports = React.createClass({
  displayName: "HomeHeader",
  render: function () {
    return dom.header(null, dom.canvas({ className: "home-demo" }));
  }
});
