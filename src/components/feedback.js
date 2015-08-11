const t = require("transducers.js");
const React = require("react");
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const api = require('impl/api');
const nprogress = require('nprogress');
const { connect } = require("../lib/redux");
const actions = require('../actions/editor');

const dom = React.DOM;

let Feedback = React.createClass({
  displayName: "Feedback",

  componentWillReceiveProps: function(nextProps) {
    // TODO(jwl): debounce this so that if multiple requests happen
    // sequentially it doesn't reset the progress bar?
    if(this.props.numRequests === 0 && nextProps.numRequests > 0) {
      nprogress.start();
    }
    else if(nextProps.numRequests === 0) {
      nprogress.done();
    }

    if(nextProps.errors.count()) {
      // TODO(jwl): Really not sure about this one. We want to remove
      // the errors after they are shown for an amount of time. Probably
      // need to move this somewhere else.
      const currentErrors = nextProps.errors;
      setTimeout(() => {
        this.props.actions.removeErrors(currentErrors);
      }, 4000);
    }
  },

  render: function() {
    if(this.props.errors.count()) {
      return dom.div(
        { className: 'notifications' },
        this.props.errors.map((err, i) => {
          return dom.div({ key: i,
                           className: 'notification error'},
                         err.message.toString());
        })
      );
    }

    return null;
  }
});

module.exports = connect(Feedback, {
  actions: actions,

  select: function(state) {
    return {
      numRequests: state.asyncRequests.get('openRequests').count(),
      errors: state.asyncRequests.get('errors')
    };
  }
});
