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
    const state = yield storeChan;
    document.title = state.get('route').title;

    if(prevState.get('route').className) {
      document.body.classList.remove(prevState.get('route').className);
    }
    if(state.get('route').className) {
      document.body.classList.add(state.get('route').className);
    }
    prevState = state;
  }
});

// Rerender the page whenever the route changes
go(function*() {
  while(true) {
    const routeState = yield routeChan;

    // TODO(jwl): need to pass in the title somehow?
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
