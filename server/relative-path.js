const path = require('path');

function relativePath(p) {
  return path.join(__dirname, p);
}

module.exports = relativePath;
