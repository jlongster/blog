const Router = require('react-router');
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const csp = require('js-csp');
const { go, chan, take, put, Throw, operations: ops } = csp;
const api = require('impl/api');

function fetchData(state, user) {
  let requests = seq(state.routes, compose(
    filter(x => x.handler.fetchData),
    map(x => {
      let handler = x.handler;
      return {
        name: x.name,
        request: (handler.requireAdmin && !user.admin ?
                  null :
                  handler.fetchData(api, state.params, user.admin))
      };
    }),
    filter(x => !!x.request)
  ));

  return go(function*() {
    let data = {};

    for(let i in requests) {
      let request = requests[i];
      if(request) {
        try {
          data[request.name] = yield take(request.request);
        }
        catch(e) {
          return Throw(e);
        }
      }
    }

    return data;
  });
}

function run(routes, location, user, initialData) {
  let ch = chan();
  let router = Router.run(routes, location, (Handler, state) => {
    go(function*() {
      let props = {};

      if(initialData) {
        props.data = initialData;
        initialData = null;
      }
      else {
        try {
          props.data = yield fetchData(state, user);
        }
        catch(e) {
          props.error = e;
        }
      }

      let route = state.routes[state.routes.length - 1];
      if(route.handler.bodyClass) {
        props.bodyClass = route.handler.bodyClass;
        props.title = route.handler.title
      }

      props.user = user;
      props.routeState = state;
      props.params = state.params;

      csp.putAsync(ch, { Handler: Handler, props: props });
    });
  });
  return { router: router, pageChan: ch };
}

module.exports = { run };
