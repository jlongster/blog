const constants = require('../constants');
const Immutable = require('immutable');
const { mergeObj } = require('../lib/util');

const initialState = {};

function update(state = initialState, action) {
  switch(action.type) {
  // This is a separate action for clarity
  case constants.UPDATE_PATH:
    return mergeObj(state, { path: action.path });

  case constants.UPDATE_PAGE_TITLE:
    return mergeObj(state, { title: action.title });

  case constants.UPDATE_USER:
    return mergeObj(state, { user: action.user });

  case constants.UPDATE_ERROR_STATUS:
    return mergeObj(state, { errorStatus: action.status });
  }

  return state;
}

module.exports = update;
