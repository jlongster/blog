const t = require("transducers.js");
const React = require("react");
const dom = React.DOM;
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const { Element, Elements } = require("../lib/util");
const { Link } = Elements(require("react-router"));
const api = require('impl/api');
const nprogress = require('nprogress');

let pending = 0;
function onXHR(comp, ch) {
  return go(function*() {
    pending++;
    nprogress.start();
    let val;

    try {
      val = yield take(ch);
    }
    catch(e) {
      comp.addError(e.message);
      val = csp.Throw(e);
    }

    pending--;
    if(!pending) {
      nprogress.done();
    }

    return val;
  });
}

let Feedback = React.createClass({
  displayName: "Feedback",

  getInitialState: function() {
    return { errors: [] };
  },

  componentDidMount: function() {
    this.xhrHandler = onXHR.bind(null, this);
    api.addHandler(this.xhrHandler);
    this.timers = [];
  },

  componentWillUnmount: function() {
    api.removeHandler(this.xhrHandler);

    this.timers.forEach(timer => {
      clearTimeout(timer);
    });
  },

  addError: function(error) {
    let errors = this.state.errors;
    errors.push(error);
    this.setState({ errors: errors });

    let timer = setTimeout(() => {
      errors.shift();
      this.timers.shift();
      this.setState({ errors: errors });
    }, 5000);
    this.timers.push(timer);
  },

  render: function() {
    let errors = this.state.errors;
    return dom.div(
      { className: errors.length ? 'feedback' : '' },
      errors.map(err => {
        return dom.div({ className: 'error',
                         dangerouslySetInnerHTML: { __html: err }});
      })
    );
  }
});

module.exports = Feedback;
