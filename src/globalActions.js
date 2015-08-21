const constants = require('./constants');
const { mergeObj } = require('./lib/util');

function updatePage(opts) {
  return mergeObj(opts, {
    type: constants.UPDATE_PAGE
  });
}

function updatePath(path) {
  return {
    type: constants.UPDATE_PATH,
    path: path
  };
}

module.exports = {
  updatePage,
  updatePath
};
