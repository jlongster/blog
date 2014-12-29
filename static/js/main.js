const React = require('react');
const Router = require('react-router');
const { Routes, Route, DefaultRoute } = Router;
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const csp = require('src/lib/csp');
const { go, chan, take, put, operations: ops } = csp;
const { decodeTextContent } = require('src/lib/util');

const routes = require('src/routes');
const api = require('./impl/api');
require('./legacy');

require('../css/main.less');
require('nprogress/nprogress.css');

let payload = JSON.parse(
  decodeTextContent(document.getElementById('payload').textContent)
);
let username = payload.username;
let isAdmin = payload.isAdmin;

let router = Router.run(routes, Router.RefreshLocation, function(Handler, state) {
  go(function*() {
    let props = {};

    if(payload) {
      props.data = payload.data;
      // Specialize the index page and prime the cache with the data
      // from it; we know it's the latest list of posts. There might
      // be a better way to do this.
      if(props.data.index) {
        api.setCache(props.data.index);
      }
      payload = null;
    }
    else {
      props.data = {};
      let requests = seq(state.routes, compose(
        filter(x => x.handler.fetchData),
        map(x => {
          let handler = x.handler;
          return {
            name: x.name,
            request: (handler.requireAdmin && !isAdmin ?
                      null :
                      handler.fetchData(api, state.params, isAdmin))
          };
        }),
        filter(x => !!x.request)
      ));

      for(let i in requests) {
        let request = requests[i];
        if(request) {
          try {
            props.data[request.name] = yield take(request.request);
          }
          catch(e) {
            props.error = e.message;
            break;
          }
        }
      }
    }

    let route = state.routes[state.routes.length - 1];
    if(route.handler.bodyClass) {
      props.bodyClass = route.handler.bodyClass;
    }

    props.username = username;
    props.isAdmin = isAdmin;
    props.routeState = state;
    props.params = state.params;

    React.render(React.createElement(Handler, props),
                 document.getElementById('mount'));
  });
});

window.relocate = function(url) {
  router.replaceWith(url);
}
