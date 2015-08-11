const React = require('react');
const t = require('transducers.js');
const { bindActionCreators } = require('redux');
const Immutable = require('immutable');
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const { invariant, mergeObj } = require('../lib/util');
const { PropTypes } = React;

const fields = {
  CHANNEL: '@@dispatch/channel',
  SEQ_ID: '@@dispatch/seqId'
};

// TODO(jwl): convert this to UUID
let seqId = 1;

function channelMiddleware({ dispatch }) {
  return next => action => {
    if(!action[fields.CHANNEL]) {
      return next(action);
    }

    const id = seqId++;

    // We proxy all the values from the channel to a new channel we
    // return so, if needed, you could still block on this channel
    // after dispatching it
    const outCh = chan();
    const ch = action[fields.CHANNEL];

    // Copy the action without the channel, and add a sequence id
    action = mergeObj(t.filter(action, x => x[0] !== fields.CHANNEL),
                      { [fields.SEQ_ID]: id });

    go(function*() {
      dispatch(mergeObj(action, { status: 'open' }));

      while(true) {
        let val;
        try {
          val = yield ch;
        }
        catch(e) {
          dispatch(mergeObj(action, { status: 'error', value: e.toString() }));
          csp.putAsync(outCh, new csp.Throw(e));
          return e;
        }

        if(val !== csp.CLOSED) {
          dispatch(mergeObj(action, { status: 'pump', value: val }));
          csp.putAsync(outCh, val);
        }
        else {
          break;
        }
      }

      dispatch(mergeObj(action, { status: 'close' }));
      outCh.close();
    });

    return outCh;
  }
}

const storeShape = React.PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired
});

function connect(component, statics) {
  const { select, runQueries, actions, namedActions } = statics;

  return React.createClass({
    contextTypes: {
      store: storeShape.isRequired
    },

    statics: statics,

    getInitialState: function() {
      const store = this.context.store;

      return {
        actions: actions ?
          { actions: bindActionCreators(actions, store.dispatch) } :
          null,
        namedActions: namedActions ?
          bindActionCreators(namedActions, store.dispatch) :
          null,
        slice: this.selectState(this.props.queryParams),
        queryParams: this.props.queryParams
      };
    },

    componentDidMount: function() {
      this.unsubscribe = this.context.store.subscribe(this.handleChange);

      if(runQueries) {
        runQueries(
          this.context.store.dispatch,
          this.context.store.getState(),
          this.state.queryParams
        );
      }
    },

    componentWillUnmount: function() {
      this.unsubscribe();
    },

    handleChange: function() {
      const results = this.selectState(this.state.queryParams);
      const changed = Object.keys(this.state.slice).some(k => {
        // TODO(jwl) need to check for immutable.js objects here and
        // use `equals`
        return results[k] !== this.state.slice[k];
      });

      if(changed) {
        this.setState({ slice: results });
      }
    },

    selectState: function(queryParams) {
      if(select) {
        return select(this.context.store.getState(), queryParams);
      }

      return null;
    },

    setQueryParams: function(params) {
      this.setState({ queryParams: params });
    },

    render: function() {
      return React.createElement(component, mergeObj(
        this.props,
        this.state.actions || {},
        this.state.namedActions || {},
        this.state.slice || {}
      ));
    }
  });
}

function channelStore(createStore) {
  return (reducer, initialState) => {
    const store = createStore(reducer, initialState);
    const stateChan = chan();
    const mult = csp.operations.mult(stateChan);

    store.subscribe(() => {
      csp.putAsync(stateChan, store.getState())
    });

    return mergeObj(store, {
      getChannel: () => {
        const ch = chan();
        mult.tap(ch);

        // Put the current state as the first value on the channel
        csp.putAsync(ch, store.getState());

        return ch;
      }
    });
  }
}

module.exports = {
  storeShape,
  connect,
  channelMiddleware,
  channelStore,
  fields
};
