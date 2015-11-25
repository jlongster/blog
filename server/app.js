const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const busboy = require('connect-busboy');
const React = require('react');
const nconf = require('nconf');
const oauth = require('oauth');
const handlebars = require('handlebars');
const transitImmutable = require('transit-immutable-js');
const RR = require('react-router');
const { match } = RR;
const RoutingContext = React.createFactory(RR.RoutingContext);
const Provider = React.createFactory(require('react-redux').Provider);
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const csp = require('js-csp');
const { go, chan, take, put, timeout, operations: ops } = csp;
const { encodeTextContent, mergeObj } = require('../src/lib/util');
const actions = Object.assign(
  {},
  require('../src/actions/page'),
  { updatePath: require('redux-simple-router').updatePath }
);

const getRoutes = require('../src/routes');
const createStore = require('../src/create-store');
const App = React.createFactory(require('../src/components/app'));
const api = require('./impl/api');
const feed = require('./feed');
const statics = require('./impl/statics');
const relativePath = require('./relative-path');

nconf.argv().env('_').file({
  file: relativePath('../config/config.json')
}).defaults({
  'admins': []
});

let app = express();
app.use(express.static(relativePath('../static')));
app.use(session({ keys: ['foo'] }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(busboy());

let appTemplate = handlebars.compile(statics.baseHTML);

// middleware

function isAdmin(username) {
  return app.testing || nconf.get('admins').indexOf(username) !== -1;
}

function requireAdmin(req, res, next) {
  let username = req.session.username;

  if(app.testing || (username && isAdmin(username))) {
    next();
  }
  else {
    res.status(401).send('must be authorized user for this action');
  }
}

// api routes

async function send(res, result) {
  try {
    let obj = await result;
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(obj));
  }
  catch(e) {
    res.status(500).send(e.message);
  }
}

async function sendOk(res, result) {
  try {
    await result;
    res.send('ok');
  }
  catch(e) {
    res.status(500).send(e.message);
  }
}

app.get('/api/posts', function(req, res) {
  let query = JSON.parse(req.query.query);
  send(res, api.queryPosts(query));
});

app.get('/api/drafts', requireAdmin, function(req, res) {
  let query = JSON.parse(req.query.query);
  send(res, api.queryDrafts(query));
});

app.get('/api/post/:post', function(req, res) {
  send(res, api.getPost(req.params.post));
});

app.put('/api/post/:post', requireAdmin, function(req, res) {
  sendOk(res, api.createPost(req.params.post, req.body));
});

app.post('/api/post/:post', requireAdmin, function(req, res) {
  sendOk(res, api.updatePost(req.params.post, req.body));
});

app.post('/api/rename-post/:post', requireAdmin, function(req, res) {
  sendOk(res, api.renamePost(req.params.post, req.body.shorturl));
});

app.delete('/api/post/:post', requireAdmin, function(req, res) {
  sendOk(res, api.deletePost(req.params.post));
});

app.post('/api/upload', requireAdmin, function(req, res) {
  req.busboy.on('file', function(fieldname, file, filename) {
    let dir = nconf.get('uploadDir');
    if(!dir) {
      throw new Error('uploadDir config not set');
    }

    let fstream = fs.createWriteStream(path.join(dir, filename));
    file.pipe(fstream);
    fstream.on('close', function () {
      res.send(nconf.get('url') + nconf.get('uploadURL') + '/' + filename);
    })
  });
  req.pipe(req.busboy);
});

// login

let oauthManager = new oauth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  nconf.get('twitter:app_key'),
  nconf.get('twitter:app_secret'),
  '1.0A',
  nconf.get('url') + '/login-callback',
  'HMAC-SHA1'
);

app.get('/login', function(req, res) {
  oauthManager.getOAuthRequestToken(function(err, token, secret, results) {
    if(err) {
      res.send('error getting request token: ' + err);
    }
    else {
      req.session.oauth_token = token;
      req.session.oauth_secret = secret;
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + token);
    }
  });
});

app.get('/login-callback', function(req, res) {
  req.session.oauth_verifier = req.query.oauth_verifier;

  oauthManager.getOAuthAccessToken(
    req.session.oauth_token,
    req.session.oauth_secret,
    req.session.oauth_verifier,
    function(err, accessToken, accessSecret, results) {
      if(err) {
        res.send('error getting access token: ' + err);
      }
      else {
        req.session.username = results.screen_name;
        res.redirect('/');
      }
    }
  );
});

app.get('/logout', function(req, res) {
  req.session.oauth_verifier = null;
  req.session.oauth_token = null;
  req.session.oauth_secret = null;
  req.session.username = null;
  res.redirect('/');
});

// catch-all 404

app.get('/api/*', function(req, res) {
  res.send('bad API request');
});

// atom feed

app.get('/atom.xml', async function(req, res) {
  let posts = await api.queryPosts({ limit: 5 });
  res.set('Content-Type', 'application/atom+xml');
  res.send(feed.render(posts));
});

// page handler

function fetchAllData(store, routeProps, isAdmin) {
  return Promise.all(routeProps.components.map(component => {
    if(component &&
       component.populateStore &&
       (!component.requireAdmin || isAdmin)) {
      return component.populateStore(store, routeProps);
    }
  }).filter(res => res));
}

function renderRouteToString(routes, store, user, url, cb) {
  match({ routes, location: url }, (err, redirect, renderProps) => {
    if(err || redirect) {
      cb(err, redirect);
    } else {
      go(function*() {
        const component = renderProps.routes[renderProps.routes.length - 1].component;
        store.dispatch(actions.updatePath(url));
        store.dispatch(actions.updateUser(user));
        store.dispatch(actions.updatePageTitle(component.title || "James Long"));

      let str;
      try {
        // Wait for all data to be loaded for the page. This will
        // dispatch actions and populate our central store.
        await fetchAllData(store, renderProps, user.admin);

        let str, renderErr;
        try {
          str = React.renderToString(
            Provider({ store }, () => RoutingContext(renderProps))
          );
        }
        catch(err) {
          renderErr = err;
        }

        cb(renderErr, null, str);
      });
    }
  });
}

function sendHTML(res, status, user, initialState, markup) {
  const payload = encodeTextContent(
    transitImmutable.toJSON({
      state: initialState,
      user: user
    })
  );

  const output = appTemplate({
    content: markup,
    payload: payload,
    className: initialState ? initialState.page.pageClass : '',
    title: initialState ? initialState.page.title : '',
    webpackURL: (process.env.NODE_ENV === 'production' ?
                 nconf.get('webpackURL') :
                 nconf.get('webpackDevURL')),
    dev: process.env.NODE_ENV !== 'production'
  });

  res.status(status).send(output);
}

app.get('*', function (req, res, next) {
  const disableServerRendering = process.env.NO_SERVER_RENDERING;
  const user = {
    name: req.session.username,
    admin: isAdmin(req.session.username)
  };

  if(!disableServerRendering) {
    const routes = getRoutes();
    const store = createStore();

    renderRouteToString(routes, store, user, req.url, (err, redirect, str) => {
      if(err) {
        // A 500 error. Just throw it in dev mode.
        if(process.env.NODE_ENV !== 'production') {
          throw err;
        }

        // Log it, change the state to a 500 error which will render a
        // 500 page, and rerender the route
        console.log('500 Error: ' + err.stack);
        store.dispatch(actions.updateErrorStatus(500));
        renderRouteToString(routes, store, user, req.url, (err, redirect, str) => {
          sendHTML(res, 500, user, store.getState(),
                   err ? 'An internal error occurred' : str);
        });
      } else if(redirect) {
        res.send(res, 302, redirect.pathname + redirect.search);
      } else {
        // Send it with the right status code, which may be something
        // like 404 if a component has set that
        const errorStatus = store.getState().route.errorStatus;
        sendHTML(res, errorStatus || 200, user, store.getState(), str);
      }
    });
  }
  else {
    sendHTML(res, 200, user, null,  '');
  }
});

module.exports = app;
