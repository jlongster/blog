const React = require('react');
const t = require('transducers.js');
const { map, filter, compose } = t;
const { bindActionCreators, combineReducers } = require('redux');
const Immutable = require('immutable');
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const { invariant, mergeObj } = require('../lib/util');
const { PropTypes } = React;
const shallowEqual = require('../lib/shallowEqual');

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
      // TODO(jwl): I think I need to call next instead
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
  const {
    select, defaultQueryParams, queryParamsProp,
    populateStore, actions, namedActions
  } = statics;

  return React.createClass({
    displayName: 'connectWrapper',

    contextTypes: {
      store: storeShape.isRequired
    },

    statics: statics,

    getInitialState: function() {
      const queryProp = queryParamsProp || 'queryParams';
      const store = this.context.store;

      return {
        actions: actions ?
          { actions: bindActionCreators(actions, store.dispatch) } :
          null,
        namedActions: namedActions ?
          bindActionCreators(namedActions, store.dispatch) :
          null,
        slice: this.selectState(this.props[queryProp]),
        queryParams: mergeObj(defaultQueryParams || {},
                              this.props[queryProp] || {})
      };
    },

    componentDidMount: function() {
      this.unsubscribe = this.context.store.subscribe(this.handleChange);
      this.populateStore();
    },

    componentWillUnmount: function() {
      this.unsubscribe();
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      const v = !shallowEqual(this.props, nextProps) ||
        !shallowEqual(this.state.slice, nextState.slice) ||
        !shallowEqual(this.state.queryParams, nextState.queryParams);
      return v;
    },

    populateStore: function(params) {
      if(populateStore) {
        populateStore(
          this.context.store.dispatch,
          this.context.store.getState(),
          params || this.state.queryParams
        );
      }
    },

    handleChange: function() {
      const results = this.selectState(this.state.queryParams);

      if(!shallowEqual(results, this.state.slice)) {
        this.setState({ slice: results });
      }
    },

    selectState: function(queryParams) {
      if(select) {
        return select(this.context.store.getState(), queryParams);
      }

      return null;
    },

    render: function() {
      return React.createElement(component, mergeObj(
        this.props,
        { queryParams: this.state.queryParams },
        this.state.actions || {},
        this.state.namedActions || {},
        this.state.slice || {}
      ));
    }
  });
}

module.exports = {
  storeShape,
  connect,
  channelMiddleware,
  fields
};
