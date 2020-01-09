const fs = require('fs');
const path = require('path');
const express = require('express');
const nconf = require('nconf');
const nunjucks = require('nunjucks');
const sane = require('sane');
const moment = require('moment');

const babel = require('@babel/core');
const mdx = require('@mdx-js/mdx');
const { mdx: mdxCreateElement, MDXProvider } = require('@mdx-js/react');
const remarkSlug = require('remark-slug');
const remarkHeadings = require('remark-autolink-headings');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const CodeBlock = require('./mdx/CodeBlock');
const LazyImage = require('./mdx/LazyImage');
const SpreadsheetWithGraph = require('./mdx/SpreadsheetWithGraph');

const ghm = require('./util/showdown-ghm.js');
const { displayDate } = require('./util/date');
const api = require('./api');
const feed = require('./feed');

nconf
  .argv()
  .env('_')
  .file({ file: path.join(__dirname, '../config/config.json') });

const app = express();
app.use(express.static(path.join(__dirname, '../static')));

const nunjucksEnv = nunjucks.configure('templates', {
  autoescape: true,
  express: app,
  watch: nconf.get('dev')
});

nunjucksEnv.addFilter('displayDate', value => {
  return displayDate(value);
});

nunjucksEnv.addFilter('postContent', (content, date) => {
  if (moment.utc(date).isBefore('2019-01-01')) {
    return ghmFilter(content);
  } else {
    return mdxFilter(content);
  }
});

function ghmFilter(content) {
  return new nunjucks.runtime.SafeString(ghm.parse(content));
}

function mdxFilter(content) {
  let code;
  try {
    code = mdx.sync(content, {
      skipExport: true,
      remarkPlugins: [remarkSlug, remarkHeadings]
    });
  } catch (e) {
    console.log('Error rendering (mdx), check the logs');
    console.log(e);
    return 'error';
  }

  try {
    code = babel.transform(code, {
      presets: ['@babel/preset-react']
    }).code;
  } catch (e) {
    console.log('Error rendering (babel), check the logs');
    console.log(e);
    return 'error';
  }

  let fn = new Function(
    'React',
    'mdx',
    `${code}; return React.createElement(MDXContent)`
  );

  let components = {
    code: CodeBlock,
    LazyImage,
    SpreadsheetWithGraph
  };

  let element = React.createElement(
    MDXProvider,
    { components },
    fn(React, mdxCreateElement)
  );

  return new nunjucks.runtime.SafeString(renderToStaticMarkup(element));
}

nunjucksEnv.addGlobal('dev', nconf.get('dev'));

// atom feed

app.get('/atom.xml', function(req, res) {
  let posts = api.queryPosts({ limit: 5 });
  res.set('Content-Type', 'application/atom+xml');
  res.send(feed.render(nunjucksEnv, posts));
});

// page handler

app.get('/', function(req, res) {
  res.render('index.html', {
    title: 'James Long',
    posts: api.queryPosts({ limit: 5 }),
    talks: [
      {
        title: 'CRDTs for Mortals',
        about: 'dotJS, Dec 2019',
        url:
          'https://www.dotconferences.com/2019/12/james-long-crdts-for-mortals'
      },
      {
        title: 'Go Ahead, Block the Main Thread',
        about: 'React Conf, Oct 2018',
        url: 'https://www.youtube.com/watch?v=ZXqyaslyXUw'
      },
      {
        title: 'My History with Papers',
        about: 'Papers We Love, Sep 2017',
        url: 'https://www.youtube.com/watch?v=UzE955UJUVU'
      },
      {
        title: 'A Prettier Printer',
        about: 'Revolution Conf, May 2017',
        url: 'https://2017.revolutionconf.com/talk/a-prettier-printer'
      },
      {
        title: 'A Prettier Printer (lightning talk)',
        about: 'React Conf, Mar 2017',
        url: 'https://www.youtube.com/watch?v=hkfBvpEfWdA'
      },
      {
        title: 'Debugging Your Debugger',
        about: 'React Rally, Sep 2016',
        url: 'https://www.youtube.com/watch?v=gvVpSezT5_M'
      },
      {
        title: 'Abstracting Just Enough',
        about: 'ReactiveConf, Nov 2015',
        url: 'https://www.youtube.com/watch?v=764wvf8KuTw'
      },
      {
        title:
          'Cleaning the Tar: Using React within the Firefox Developer Tools',
        about: 'Strange Loop, Sep 2015',
        url: 'https://www.youtube.com/watch?v=qUlRpybs7_c'
      },
      {
        title: 'Unshackling JavaScript with Macros',
        about: 'JSConf, May 2014',
        url: 'https://www.youtube.com/watch?v=wTkcGprt5rU'
      },
      {
        title: 'High-Performance WebGL Apps with LLJS and asm.js',
        about: 'CascadiaJS, Nov 2013',
        url: 'https://www.youtube.com/watch?v=HL3upR6g1yg'
      }
    ]
  });
});

app.get('/subscribe-thanks', function(req, res) {
  res.render('subscribe-message.html', {
    title: 'Please confirm your email',
    message:
      "Check your email to confirm your subscription. If you don't see it within 30 seconds, check your spam folder. Thank you!"
  });
});

app.get('/subscribe-confirm', function(req, res) {
  res.render('subscribe-message.html', {
    title: 'Confirmed',
    message:
      'Thank you for confirming your email! You will now receive posts in your inbox as they are published.'
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

app.get('/contracting', function(req, res) {
  res.render('contracting.html');
});

if (nconf.get('dev')) {
  // Drafts page
  app.get('/drafts', function(req, res) {
    res.render('post-list.html', {
      title: 'Drafts',
      posts: api.queryAllPosts({ filter: { published: false } })
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
} else {
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
  const shorturl = req.path.slice(1);
  let post = api.getPost(shorturl);
  if (post) {
    if (post.readnext) {
      post = Object.assign({}, post, { readnext: api.getPost(post.readnext) });
    }

    res.render('post.html', Object.assign({}, post));
  } else {
    res.status(404);
    res.render('404.html');
  }
});

// Initial indexing of posts
api.indexPosts(nconf.get('postsDir'));

app.listen(nconf.get('http:port'));
console.log('Server listening on ' + nconf.get('http:port') + '...');
