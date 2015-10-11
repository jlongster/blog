const React = require('react');
const { Provider } = require('react-redux');
const { match, RoutingContext } = require('react-router');
const { mergeObj } = require('./util');
const { REPLACE_STATE } = require('./replaceable-state');

module.exports = (state, store, routes) => {
  if(state.version !== store.getState().version) {
    console.warn(
      "Loaded state has a different version than current state. " +
      "Current app is running " + store.getState().version +
      " and loaded state has " + state.version
    );
  }

  // First, install the new state and add a flag to tell the router
  // not to do anything yet
  state = mergeObj(state, {
    route: mergeObj(state.route, {
      avoidRouterUpdate: true
    })
  });
  store.dispatch({ type: REPLACE_STATE, state: state });

  // Then manually render the routed components. We do it this way so
  // that we don't mess with the browser history, which would be
  // problematic in certain cases like if the router uses full
  // refreshes. We shouldn't depend on the router behavior, and this
  // is a special case anyway and it's OK that the URL doesn't update.
  match({ routes, location: state.route.path },
        (err, redirect, renderProps) => {
          React.render(
            React.createElement(
              Provider,
              { store },
              () => React.createElement(RoutingContext, renderProps)
            ),
            document.getElementById('mount')
          );
        });
}
