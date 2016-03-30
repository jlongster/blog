const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const busboy = require('connect-busboy');
const nconf = require('nconf');
const nunjucks = require('nunjucks');

const ghm = require('../src/lib/showdown-ghm.js');
const { encodeTextContent, mergeObj } = require('../src/lib/util');
const { displayDate } = require('../src/lib/date');
const api = require('./impl/api');
const feed = require('./feed');
const statics = require('./impl/statics');
const relativePath = require('./relative-path');

nconf.argv().env('_').file({
  file: relativePath('../config/config.json')
}).defaults({
  'admins': []
});

const app = express();
app.use(express.static(relativePath('../static')));
app.use(session({ keys: ['foo'] }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(busboy());

const nunjucksEnv = nunjucks.configure('templates', {
  autoescape: true,
  express: app,
  watch: true
});

nunjucksEnv.addFilter('displayDate', value => {
  return displayDate(value);
});

nunjucksEnv.addFilter('ghm', value => {
  return new nunjucks.runtime.SafeString(ghm.parse(value));
});

api.indexPosts(relativePath('../posts'));

// api routes

// app.post('/api/upload', requireAdmin, function(req, res) {
//   req.busboy.on('file', function(fieldname, file, filename) {
//     let dir = nconf.get('uploadDir');
//     if(!dir) {
//       throw new Error('uploadDir config not set');
//     }

//     let fstream = fs.createWriteStream(path.join(dir, filename));
//     file.pipe(fstream);
//     fstream.on('close', function () {
//       res.send(nconf.get('url') + nconf.get('uploadURL') + '/' + filename);
//     })
//   });
//   req.pipe(req.busboy);
// });

// atom feed

app.get('/atom.xml', function(req, res) {
  let posts = api.queryPosts({ limit: 5 });
  res.set('Content-Type', 'application/atom+xml');
  res.send(feed.render(nunjucksEnv, posts));
});

// page handler

app.get('/', function (req, res) {
  res.render('index.html', {
    posts: api.queryPosts({ limit: 5 })
  });
});

app.get('/archive', function(req, res) {
  res.render('post-list.html', {
    title: 'All Posts',
    posts: api.queryPosts({})
  });
});

app.get('/tag/:name', function(req, res) {
  res.render('post-list.html', {
    title: 'Tag: ' + req.params.name,
    posts: api.queryPosts({ filter: { tags: req.params.name } })
  });
});

app.get('/*', function(req, res) {
  const shorturl = req.url.slice(1);
  let post = api.getPost(shorturl);
  if(post) {
    if(post.readnext) {
      post = Object.assign({}, post, {
        readnext: api.getPost(post.readnext)
      });
    }
    res.render('post.html', post);
  }
  else {
    res.render('404.html');
  }
});

app.listen(nconf.get('http:port'));
console.log('Server listening on ' + nconf.get('http:port') + '...');
