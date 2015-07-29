const constants = require('../constants');
const Immutable = require('immutable');

const initialState = {
  showSettings: false,
  showPreview: false
};

function editor(state = initialState, action) {
  switch(action.type) {
  case constants.TOGGLE_SETTINGS:
    return state.showSettings =
      (action.isOpen !== undefined) ? action.isOpen : !state.showSettings;
  case constants.TOGGLE_PREVIEW:
    return state.showPreview =
      (action.isOpen !== undefined) ? action.isOpen : !state.showPreview;
  default:
    return state;
  }
}

module.exports = editor;
