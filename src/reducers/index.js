const posts = require('./posts');
const asyncRequests = require('./async-requests');
const page = require('./page');
const editor = require('./editor');
const localState = require('./local-state');
const version = require('./version');

module.exports = {
  posts,
  asyncRequests,
  page,
  editor,
  version,
  __localState: localState
};
