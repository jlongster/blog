const React = require('react');
const ReactDOM = require('react-dom');
const { Provider } = require('react-redux');
const transitImmutable = require('transit-immutable-js');
const createHistory = require('history/lib/createBrowserHistory');
const { useRoutes } = require('react-router');
const { decodeTextContent } = require('../../src/lib/util');
const loadSnapshot = require('../../src/lib/load-snapshot');
const createStore = require('../../src/create-store');
const { updateUser, updatePageTitle } = require('../../src/actions/page');
const getRoutes = require('../../src/routes');
const { syncReduxAndRouter } = require('redux-simple-router');
const api = require('./impl/api');

// CSS dependencies

require('nprogress/nprogress.css');
require('../css/theme/main.less');

// App init

const payload = transitImmutable.fromJSON(
  decodeTextContent(document.getElementById('payload').textContent)
);
console.log(payload.state);

const store = createStore(payload.state ? payload.state : undefined);
store.dispatch(updateUser(payload.user));

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
    const response = prompt(
      'App State (note: router will be broken after this. I don\'t ' +
      'know how to fix it yet)',
      str
    );
    let state = store.getState();
    try {
      if(response) {
        state = transitImmutable.fromJSON(response);
      }
      else {
        return;
      }
    }
    catch(e) {
      console.log('error', e);
    }

    loadSnapshot(state, store, getRoutes(store, history));
  }
});

// Sync the history location and the store location together
const history = createHistory({ forceRefresh: true });
syncReduxAndRouter(history, store);

ReactDOM.render(
  React.createElement(Provider, { store }, getRoutes(store, history)),
  document.getElementById('mount')
);
