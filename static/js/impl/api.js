const t = require('transducers.js');
const { filter } = t;
const csp = require('js-csp');
const { go, chan, take, put, operations: ops } = csp;
const xhr = require('src/lib/xhr');

let postCache = [];
let handlers = [];

function addHandler(func) {
  handlers.push(func);
}

function removeHandler(func) {
  handlers = filter(handlers, x => x !== func);
}

function runHandlers(ch) {
  // TODO: need promise chans
  for(let i in handlers) {
    ch = handlers[i](ch);
  }
  return ch;
}

// This is called when a payload is delivered from the server on
// first-load that already has done the query
function setCache(posts) {
  postCache = posts;
}

function clearCache() {
  postCache = [];
}

function getCached(shorturl) {
  return t.seq(postCache, t.compose(
    filter(x => x.shorturl === shorturl),
    t.take(1)
  ))[0];
}

// This is a specialized query function that is cache-able; the query
// will only be rerun when more posts are needed
function getPosts(limit) {
  let url = '/api/posts?query=' + JSON.stringify({
    limit: limit,
    filter: { published: true }
  });

  if(limit <= postCache.length) {
    let ch = chan();
    csp.putAsync(ch, postCache.slice(0, limit), () => ch.close());
    return ch;
  }

  return go(function*() {
    let res = yield runHandlers(xhr({ url: url }));
    setCache(res.json);
    return res.json;
  }, { propagate: true });
}

function queryDrafts(query) {
  return runHandlers(
    xhr({ url: '/api/drafts?query=' + JSON.stringify(query || {}) },
        chan(1, t.map(x => x.json)))
  );
}

function queryPosts(query) {
  return runHandlers(
    xhr({ url: '/api/posts?query=' + JSON.stringify(query || {}) },
        chan(1, t.map(x => x.json)))
  );
}

function getPost(shorturl) {
  let res = filter(postCache, post => post.shorturl === shorturl);
  if(res.length) {
    let ch = chan();
    csp.putAsync(ch, res[0], () => ch.close());
    return ch;
  }
  else {
    return runHandlers(xhr({ url: '/api/post/' + shorturl },
                           chan(1, t.map(x => x.json))));
  }
}

function createPost(shorturl, props) {
  clearCache();
  return runHandlers(xhr({
    url: '/api/post/' + shorturl,
    method: 'put',
    json: props
  }));
}

function updatePost(shorturl, props) {
  clearCache();
  return runHandlers(xhr({
    url: '/api/post/' + shorturl,
    method: 'post',
    json: props
  }));
}

function renamePost(oldurl, newurl) {
  clearCache();
  return runHandlers(xhr({
    url: '/api/rename-post/' + oldurl,
    method: 'post',
    json: { shorturl: newurl }
  }));
}

function deletePost(shorturl) {
  clearCache();
  return runHandlers(xhr({
    url: '/api/post/' + shorturl,
    method: 'delete'
  }));
}

module.exports = {
  setCache,
  clearCache,
  getCached,
  addHandler,
  removeHandler,
  getPosts,
  queryPosts,
  queryDrafts,
  getPost,
  createPost,
  updatePost,
  renamePost,
  deletePost
}
