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

const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const { go, chan, take, put, timeout, operations: ops } = require('js-csp');
const { encodeTextContent, Element, Elements } = require('../src/lib/util');
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

function send(res, ch) {
  go(function*() {
    try {
      let obj = yield take(ch);
      res.set('Content-Type', 'application/json');
      res.send(JSON.stringify(obj));
    }
    catch(e) {
      res.status(500).send(e.message);
    }
  });
}

function sendOk(res, ch) {
  go(function*() {
    try {
      yield take(ch);
      res.send('ok');
    }
    catch(e) {
      res.status(500).send(e.message);
    }
  });
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

// page handler

app.get('/atom.xml', function(req, res) {
  go(function*() {
    let posts = yield api.getPosts(5);
    res.set('Content-Type', 'application/atom+xml');
    res.send(feed.render(posts));
  });
});

let routes, bootstrap;
if(!process.env.NO_SERVER_RENDERING) {
  // Only pull this in if we are server-rendering so that development
  // build times are fast
  routes = require('../src/routes');
  bootstrap = require('../src/bootstrap');
}

app.get('*', function (req, res, next) {
  let disableServerRendering = (
    process.env.NO_SERVER_RENDERING || req.cookies.renderOnServer === 'n'
  );

  go(function*() {
    let payload = {
      user: { name: req.session.username,
              admin: isAdmin(req.session.username) },
      config: {
        url: nconf.get('url')
      }
    };
    let title = 'James Long';
    let bodyClass = '';
    let content = 'Loading...';

    if(!disableServerRendering) {
      let { router, routeChan, store } = bootstrap.run(routes, {
        location: req.path,
        user: payload.user,
        prefetchData: true
      });

      // Wait for all data to be loaded for the page
      yield take(pageChan);
      // TODO(jwl): need to use transit to serialize the state and send
      // it across.
      payload.data = store.getState();

      // TODO(jwl): show this error
      // if(process.env.NODE_ENV !== 'production' && props.error) {
      //   res.send(props.error.stack);
      //   throw props.error;
      // }

      const state = store.getState();
      title = state.get('route').title;
      bodyClass = state.get('route').bodyClass;

      content = React.renderToString(React.createElement(Handler, props))
    }

    let result = appTemplate({
      content: content,
      payload: encodeTextContent(JSON.stringify(payload)),
      bodyClass: bodyClass,
      title: title,
      webpackURL: nconf.get('webpackURL')
    });

    res.send(result);
  });
});

module.exports = app;
