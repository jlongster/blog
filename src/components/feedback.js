const t = require("transducers.js");
const React = require("react");
const dom = React.DOM;
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const { Element, Elements } = require("../lib/util");
const { Link } = Elements(require("react-router"));
const api = require('impl/api');
const nprogress = require('nprogress');
const { connect } = require("../lib/redux");

let Feedback = React.createClass({
  displayName: "Feedback",

  componentWillReceiveProps: function(nextProps) {
    // TODO(jwl): debounce this so that if multiple requests happen
    // sequentially it doesn't reset the progress bar?
    if(this.props.numRequests > 0 && nextProps.numRequests === 0) {
      nprogress.done();
    }
    else {
      nprogress.start();
    }
  },

  render: function() {
    // TODO: show growl-like notifications for errors returned from
    // server
    return null;
  }
});

module.exports = connect(Feedback, {
  select: function(state) {
    return {
      numRequests: state.get('pendingRequests').count()
    };
  }
});
