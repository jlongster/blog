const path = require('path');
const fs = require('fs');
const { mergeObj } = require("./util/util");
const t = require("transducers.js");
const yamlFront = require("yaml-front-matter");
const moment = require("moment");

let postFields = [
  'shorturl',
  'title',
  'abstract',
  'content',
  'date',
  'published',
  'tags',
  'headerimg',
  'headerimgfull',
  'readnext',
  'assets'
];

const _postIndex = {};
const _allPosts = [];

function _getPosts(keys) {
  return keys.map(k => _postIndex[k]);
}

function _runQuery(opts) {
  opts = opts || {};
  let posts = _allPosts;

  if(opts.filter) {
    for(let name in opts.filter) {
      posts = posts.filter(x => {
        if(x[name] && x[name].length) {
          return x[name].indexOf(opts.filter[name]) !== -1;
        }

        return x[name] === opts.filter[name];
      })
    }
  }

  if(opts.select) {
    posts = posts.map(x => {
      return t.toObj(opts.select, t.map(name => [name, x[name]]));
    });
  }

  if(opts.limit) {
    posts = posts.slice(0, opts.limit);
  }

  return posts;
}

// public API

function queryAllPosts(query) {
  return _runQuery(query);
}

function queryPosts(query) {
  query = mergeObj(query, {
    filter: mergeObj(query.filter || {}, { published: true })
  });
  return _runQuery(query);
}

function getPost(key) {
  return _postIndex[key];
}

function indexPosts(dirpath) {
  const files = fs.readdirSync(dirpath);
  files.forEach(file => {
    if(!file.match(/\.md$/)) {
      return;
    }

    const contents = fs.readFileSync(path.join(dirpath, file));
    const results = yamlFront.loadFront(contents);
    const post = Object.assign(results, { content: results.__content });

    const m = post.content.match(/^\s*# ([^\n]*)\n\n/m);
    if(m) {
      post.title = m[1];
      post.content = post.content.slice(m[0].length);
    }

    if(post.date instanceof Date) {
      post.date = moment.utc(post.date).valueOf();
    }
    else if(post.date.toString().match(/\d{8}/)) {
      post.date = moment.utc(post.date, "YYYYMMDD").valueOf();
    }
    else if(post.date.match(/\w+ \d{1,2}, \d{4}/)) {
      post.date = moment.utc(post.date, "MMMM D, YYYY").valueOf();
    }

    _postIndex[post.shorturl] = post;
    _allPosts.push(post);
  });

  _allPosts.sort((a, b) => {
    if(a.date < b.date) {
      return 1;
    }
    else if(a.date > b.date) {
      return -1;
    }
    return 0;
  });
}

module.exports = {
  indexPosts,
  getPost,
  queryPosts,
  queryAllPosts
};
