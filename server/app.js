const fs = require('fs');
const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const React = require('react');
const nconf = require('nconf');
const oauth = require('oauth');
const handlebars = require('handlebars');

const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const { go, chan, take, put, operations: ops } = require('../src/lib/csp');
const { encodeTextContent, Element, Elements } = require('../src/lib/util');
const ServerError = require('../src/components/server-error');
const routes = require('../src/routes');
const api = require('./impl/api');
const feed = require('./feed');
const statics = require('./impl/statics');
const relativePath = require('./relative-path');
const bootstrap = require('../src/bootstrap');

nconf.argv().env('_').file({
  file: relativePath('../config/config.json')
}).defaults({
  'admins': []
});

let app = express();
app.use(express.static(relativePath('../static')));
app.use(session({ keys: ['foo'] }));
app.use(bodyParser.json());

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
    res.status(401).render('bad auth, man');
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

app.get('*', function(req, res, next) {
  go(function*() {
    let { router, pageChan } = bootstrap.run(
      routes,
      req.path,
      { name: req.session.username,
        admin: isAdmin(req.session.username) }
    );
    let { Handler, props } = yield take(pageChan);

    if(process.env.NODE_ENV !== 'production' && props.error) {
      res.send(props.error.stack);
      throw props.error;
    }

    let payload = {
      data: props.data,
      user: props.user,
      config: {
        url: nconf.get('url')
      }
    };

    let title = typeof props.title === 'function' ? props.title(props.data) : props.title;
    let content = appTemplate({
      content: React.renderToString(React.createElement(Handler, props)),
      payload: encodeTextContent(JSON.stringify(payload)),
      bodyClass: props.bodyClass || '',
      title: title || 'James Long'
    });

    res.send(content);
  });
});

module.exports = app;
