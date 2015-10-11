const constants = require('../constants');

function toggleSettings() {
  return (dispatch, getState) => {
    dispatch({
      type: constants.TOGGLE_SETTINGS,
      isOpen: !getState().editor.showSettings
    });
  }
}

function togglePreview() {
  return (dispatch, getState) => {
    dispatch({
      type: constants.TOGGLE_PREVIEW,
      isOpen: !getState().editor.showPreview
    });
  }
}

module.exports = { toggleSettings, togglePreview };
