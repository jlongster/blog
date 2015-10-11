const posts = require('./posts');
const asyncRequests = require('./async-requests');
const route = require('./route');
const editor = require('./editor');
const localState = require('./local-state');
const version = require('./version');

module.exports = {
  posts,
  asyncRequests,
  route,
  editor,
  version,
  __localState: localState
};
