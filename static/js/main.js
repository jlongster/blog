const React = require('react');
const { Provider } = require('react-redux');
const transitImmutable = require('transit-immutable-js');
const createHistory = require('history/lib/createBrowserHistory');
const { useRoutes } = require('react-router');
const { decodeTextContent } = require('../../src/lib/util');
const loadSnapshot = require('../../src/lib/load-snapshot');
const createStore = require('../../src/create-store');
const { updateUser, updatePath, updatePageTitle } = require('../../src/actions/route');
const getRoutes = require('../../src/routes');
const api = require('./impl/api');
const { go, take } = require('js-csp');

// CSS dependencies

require('nprogress/nprogress.css');
require('../css/main.less');

// App init

const payload = transitImmutable.fromJSON(
  decodeTextContent(document.getElementById('payload').textContent)
);

const store = createStore(payload.state ? payload.state : undefined);
const history = createHistory();
store.dispatch(updateUser(payload.user));

// Sync the history location and the store location together
function locationToString(location) {
  return location.pathname +
    (location.search ? ('?' + location.search) : '') +
    (location.hash ? ('#' + location.hash) : '');
}

history.listen(location => {
  // Avoid dispatching an action if the store is already up-to-date,
  // even if `history` wouldn't do anthing if the location is the same
  if(store.getState().route.path !== locationToString(location)) {
    store.dispatch(updatePath(locationToString(location)));
  }

  // Reset the title (components may have dynamically changed it)
  store.dispatch(updatePageTitle("James Long"));
});

store.subscribe(() => {
  const routeState = store.getState().route;
  // Don't update the router is nothing has changed. The
  // `avoidRouterUpdate` flag can be set to avoid updating altogether,
  // which is useful for things like loading snapshots or very special
  // edge cases.
  if(routeState.path !== locationToString(window.location) &&
     !routeState.avoidRouterUpdate) {
    // When `history` allows full refreshes, use its API instead
    // history.pushState(null, routeState.path);
    window.location.href = routeState.path;
  }
});

// Allow copying and pasting app state
document.addEventListener('keydown', function(e) {
  // cmd+shift+k
  const cmdShiftK = e.metaKey && e.shiftKey && e.keyCode === 75;
  const cmdShiftI = e.metaKey && e.shiftKey && e.keyCode === 73;

  if(cmdShiftI) {
    const str = transitImmutable.toJSON(store.getState());
    console.log(str);
  }
  else if(cmdShiftK) {
    e.preventDefault();
    const str = transitImmutable.toJSON(store.getState());
    const response = prompt('App State', str);
    let state = store.getState();
    try {
      if(response) {
        state = transitImmutable.fromJSON(response);
      }
    }
    catch(e) {
      console.log('error', e);
    }

    loadSnapshot(state, store, getRoutes(history));
  }
});

React.render(
  React.createElement(
    Provider,
    { store },
    () => getRoutes(history)
  ),
  document.getElementById('mount')
);
