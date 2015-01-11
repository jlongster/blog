const path = require('path');

function relativePath(p) {
  // We are actually running in the .built directory which adds a
  // level of nesting
  return path.join(__dirname + '/..', p);
}

module.exports = relativePath;
