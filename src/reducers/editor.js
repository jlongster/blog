const constants = require('../constants');
const { mergeObj } = require('../lib/util');

const initialState = {
  showSettings: false,
  showPreview: false
};

function update(state = initialState, action) {
  switch(action.type) {
  case constants.TOGGLE_SETTINGS:
    return mergeObj(state, {
      showSettings: (action.isOpen !== undefined) ?
        action.isOpen :
        !state.showSettings
    });
  case constants.TOGGLE_PREVIEW:
    return mergeObj(state, {
      showPreview: (action.isOpen !== undefined) ?
        action.isOpen :
        !state.showPreview
    });
  default:
    return state;
  }
}

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

module.exports = {
  update: update,
  actions: { toggleSettings, togglePreview }
};
