const fs = require('fs');
const path = require('path');
const express = require('express');
const nconf = require('nconf');
const nunjucks = require('nunjucks');
const sane = require('sane');

const ghm = require('./util/showdown-ghm.js');
const { displayDate } = require('./util/date');
const api = require('./api');
const feed = require('./feed');

nconf.argv().env('_').file({
  file: path.join(__dirname, '../config/config.json')
});

const app = express();
app.use(express.static(path.join(__dirname, '../static')));

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

nunjucksEnv.addGlobal('dev', nconf.get('dev'));

api.indexPosts(nconf.get("postsDir"));

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

if(nconf.get('dev')) {
  // Drafts page
  app.get('/drafts', function(req, res) {
    res.render('post-list.html', {
      title: 'Drafts',
      posts: api.queryAllPosts({ filter: { published: false }})
    });
  });

    // Hot reloading
  let shouldRefresh = false;

  function reload() {
    console.log('Reloading...');

    api.indexPosts(nconf.get('postsDir'));
    shouldRefresh = true;
  }

  const watcher = sane(nconf.get('postsDir'));
  watcher.on('change', reload);
  watcher.on('add', reload);
  watcher.on('delete', reload);

  app.get('/modified', function(req, res) {
    res.send(JSON.stringify(shouldRefresh));
    shouldRefresh = false;
  });
}
else {
  // Live mode, just update the index
  function refresh() {
    api.indexPosts(nconf.get('postsDir'));
  }

  const watcher = sane(nconf.get('postsDir'));
  watcher.on('change', refresh);
  watcher.on('add', refresh);
  watcher.on('delete', refresh);
}

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
    res.status(404);
    res.render('404.html');
  }
});

app.listen(nconf.get('http:port'));
console.log('Server listening on ' + nconf.get('http:port') + '...');
