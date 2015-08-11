const Router = require('react-router');
const redux = require('redux');
const reduxThunk = require('redux-thunk');
const { channelMiddleware, channelStore } = require('./lib/redux');
const createStore = redux.applyMiddleware(
  reduxThunk,
  channelMiddleware
)(channelStore(redux.createStore));
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const csp = require('js-csp');
const { go, chan, take, put, Throw, operations: ops } = csp;
const api = require('impl/api');
const stateReducers = require('./reducers');
const constants = require('./constants');
const { updatePath, updatePage } = require('./actions/blog');

function fetchAllData(store, state, isAdmin) {
  var ch = chan();
  store.subscribe(() => {
    const pendingRequests = store.getState().pendingRequests;
    if(!pendingRequests.count()) {
      csp.putAsync(ch, true);
    }
  });

  for(let route of state.routes) {
    let handler = route.handler;

    if(handler.runQueries && (!handler.requireAdmin || isAdmin)) {
      const params = mergeObj(handler.queryParams || {}, state.params);
      handler.runQueries(store.dispatch, store.getState(), params);
    }
  }

  return ch;
}

function run(routes, { location, user, initialData, prefetchData }) {
  const store = createStore(redux.combineReducers(stateReducers),
                            initialData);
  const ch = chan();

  const router = Router.run(routes, location, (Handler, state) => {
    go(function*() {
      if(prefetchData) {
        yield fetchAllData(store, state, user.admin);
      }

      let routeState = {};
      let route = state.routes[state.routes.length - 1];
      if(route.handler.bodyClass) {
        routeState.bodyClass = route.handler.bodyClass;
      }

      routeState.user = user;
      routeState.routeState = state;
      routeState.params = state.params;
      routeState.handler = Handler;

      store.dispatch(updatePath(state.path));
      store.dispatch(updatePage({
        title: route.handler.title,
        className: route.handler.pageClass,
        user: user
      }));

      yield put(ch, routeState);
    });
  });

  return { router: router, routeChan: ch, store: store };
}

module.exports = { run };
