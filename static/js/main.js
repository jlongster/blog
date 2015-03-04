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

const routes = require('src/routes');
const api = require('./impl/api');

// CSS dependencies

require('nprogress/nprogress.css');
require('../css/main.less');

// App init

let payload = JSON.parse(
  decodeTextContent(document.getElementById('payload').textContent)
);
config.load(payload.config);

let { router, pageChan } = bootstrap.run(
  routes,
  Router.RefreshLocation,
  { user: payload.user },
  payload.data
);

go(function*() {
  let { Handler, props } = yield take(pageChan);
  React.render(React.createElement(Handler, props),
               document.getElementById('mount'));
});

window.relocate = function(url) {
  router.replaceWith(url);
}
