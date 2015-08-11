const constants = require('../constants');
const Immutable = require('immutable');
const { mergeObj } = require('../lib/util');

const initialState = {
  title: 'James Long',
  bodyClass: ''
};

function route(state = initialState, action) {
  switch(action.type) {
  // This is a separate action for clarity
  case constants.UPDATE_PATH:
    return mergeObj(state, { path: action.path });

  case constants.UPDATE_PAGE:
    return mergeObj(state, {
      title: action.title || state.title,
      className: action.className || state.className,
      user: action.user || state.user
    });
  }

  return state;
}

module.exports = route;
