const t = require('transducers.js');
const { filter } = t;
const csp = require('js-csp');
const { go, chan, take, put, operations: ops } = csp;
const xhr = require('../../../src/lib/xhr');

function queryDrafts(query) {
  return xhr(
    { url: '/api/drafts?query=' + JSON.stringify(query || {}) }
  ).then(x => x.json);
}

function queryPosts(query) {
  return xhr(
    { url: '/api/posts?query=' + JSON.stringify(query || {}) }
  ).then(x => x.json);
}

function getPost(shorturl, actionType) {
  return xhr(
    { url: '/api/post/' + shorturl },
  ).then(x => x.json);
}

function createPost(shorturl, props) {
  return xhr({
    url: '/api/post/' + shorturl,
    method: 'put',
    json: props
  });
}

function updatePost(shorturl, props) {
  return xhr({
    url: '/api/post/' + shorturl,
    method: 'post',
    json: props
  });
}

function renamePost(oldurl, newurl) {
  return xhr({
    url: '/api/rename-post/' + oldurl,
    method: 'post',
    json: { shorturl: newurl }
  });
}

function deletePost(shorturl) {
  return xhr({
    url: '/api/post/' + shorturl,
    method: 'delete'
  });
}

module.exports = {
  queryPosts,
  queryDrafts,
  getPost,
  createPost,
  updatePost,
  renamePost,
  deletePost
}
