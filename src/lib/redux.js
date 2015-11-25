const React = require('react');
const { bindActionCreators, combineReducers } = require('redux');
const { connect: reduxConnect } = require('react-redux');
const t = require('transducers.js');
const { map, filter, compose } = t;
const Immutable = require('immutable');
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const { invariant, mergeObj } = require('../lib/util');
const { PropTypes } = React;
const shallowEqual = require('../lib/shallowEqual');

const fields = {
  PROMISE: '@@dispatch/promise',
  SEQ_ID: '@@dispatch/seqId'
};

// TODO(jwl): convert this to UUID
let seqId = 1;

function promiseMiddleware({ dispatch }) {
  return next => action => {
    if(!action[fields.PROMISE]) {
      return next(action);
    }

    const promiseInst = action[fields.PROMISE];
    const id = seqId++;
    // Copy the action without the channel, and add a sequence id
    action = mergeObj(t.filter(action, x => x[0] !== fields.PROMISE),
                      { [fields.SEQ_ID]: id });

    dispatch(mergeObj(action, { status: "start" }));

    // Return the promise so action creators can still compose if they
    // want to.
    return new Promise(function(resolve, reject) {
      promiseInst.then(value => {
        setTimeout(() => {
          dispatch(mergeObj(action, {
            status: "done",
            value: value
          }));
          resolve(value);
        }, 0);
      }).catch(error => {
        setTimeout(() => {
          dispatch(mergeObj(action, {
            status: "error",
            value: error
          }));
          reject(error);
        }, 0);
      });
    });
  };
}

function autoconnect(component) {
  return reduxConnect(
    component.select,
    dispatch => Object.assign(
      component.actions ?
        { actions: bindActionCreators(component.actions) } : {},
      component.namedActions ?
        bindActionCreators(component.namedActions) : {}
    )
  )(component);
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
  fields,
  promiseMiddleware,
  storeShape,
  connect,
  autoconnect
};
