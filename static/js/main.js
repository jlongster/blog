const React = require('react');
const Router = require('react-router');
const { Routes, Route, DefaultRoute } = Router;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const cookie = require('cookie');
const csp = require('js-csp');
const { go, chan, take, put, timeout, operations: ops } = csp;
const { decodeTextContent } = require('../../src/lib/util');
const config = require('../../src/lib/config');
const bootstrap = require('../../src/bootstrap');
const { Provider } = require('react-redux');
const transitImmutable = require('transit-immutable-js');

const routes = require('../../src/routes');
const api = require('./impl/api');

// CSS dependencies

require('nprogress/nprogress.css');
require('../css/main.less');

// App init

// TODO(jwl): use transit to parse this instead
let payload = JSON.parse(
  decodeTextContent(document.getElementById('payload').textContent)
);
// TODO(jwl): I think I only use this for URL, which we should just
// get from the browser
config.load(payload.config);

let { router, routeChan, store } = bootstrap.run(routes, {
  location: Router.RefreshLocation,
  user: payload.user,
  initialData: payload.data
});

// Update the page properties whenever they change
go(function*() {
  const storeChan = store.getChannel();
  let prevState = store.getState();

  while(true) {
    const state = yield take(storeChan);
    document.title = state.route.title;

    if(prevState.route.className) {
      document.body.classList.remove(prevState.route.className);
    }
    if(state.route.className) {
      document.body.classList.add(state.route.className);
    }

    // If the path has changed but the page hasn't actually updated to
    // reflect that, update the router
    const currentPath = location.pathname + location.search + location.hash;
    if(state.route.path && state.route.path !== currentPath) {
      router.replaceWith(state.route.path);
    }

    prevState = state;
  }
});

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

    const reducer = store.getReducer();
    store.replaceReducer((state, action) => {
      const response = prompt('App State', str);
      try {
        return transitImmutable.fromJSON(response);
      }
      catch(e) {
        return transitImmutable.fromJSON(str);
      }
    });
    store.replaceReducer(reducer);

    const state = store.getState();
    // Rerender the page with the new path.
    router.dispatch(state.route.path);
    // Update the URL without refreshing. My router is not configured
    // to use pushState (uses full refresh), so yes this breaks the
    // back button because it isn't listening for history changes. But
    // it's not a big deal for resuming the state (only used for dev).
    history.pushState(null, state.route.title, state.route.path);
  }
});

// Rerender the page whenever the route changes
go(function*() {
  while(true) {
    const routeState = yield routeChan;

    React.render(
      React.createElement(
        Provider,
        { store: store },
        () => React.createElement(routeState.handler,
                                  { route: routeState,
                                    queryParams: routeState.params })
      ),
      document.getElementById('mount')
    );
  }
});

window.relocate = function(url) {
  router.replaceWith(url);
}
