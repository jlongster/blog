const constants = require('../constants');
const { fields } = require('../lib/redux');
const api = require("impl/api");

function toggleSettings(isOpen) {
  return {
    type: constants.TOGGLE_SETTINGS,
    isOpen: isOpen
  };
}

function togglePreview(isOpen) {
  return {
    type: constants.TOGGLE_PREVIEW,
    isOpen: isOpen
  };
}

function savePost(post) {
  return {
    type: constants.SAVE_POST,
    post: post,
    [fields.CHANNEL]: api.savePost(post)
  }
}

module.exports = {
  toggleSettings,
  togglePreview,
  savePost
};
