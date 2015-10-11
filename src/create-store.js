const { compose, applyMiddleware, createStore, combineReducers } = require('redux');
const reduxThunk = require('redux-thunk');
const { channelMiddleware, channelStore } = require('./lib/redux');
const reducers = require('./reducers');
const { replaceable } = require('./lib/replaceable-state');
const { mergeObj } = require('./lib/util');

module.exports = (state, version) => {
  const create = compose(
    applyMiddleware(
      reduxThunk,
      channelMiddleware,
      () => next => action => {
        // Our own logger because none of the fancy loggers supports
        // server-side rendering.
        // console.log(action);
        return next(action);
      }
    ),
    channelStore,
    createStore
  );

  return create(
    replaceable(combineReducers(reducers), version),
    state
  );
};
