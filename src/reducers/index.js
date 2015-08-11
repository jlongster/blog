const posts = require('./posts');
const asyncRequests = require('./async-requests');
const route = require('./route');
const editor = require('./editor');
const localState = require('./local-state');

module.exports = {
  posts,
  asyncRequests,
  route,
  editor,
  __localState: localState
};
