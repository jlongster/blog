const constants = require('../constants');
const Immutable = require('immutable');
const { mergeObj } = require('../lib/util');

const initialState = {
  title: 'James Long',
  bodyClass: ''
};

function route(state = initialState, action) {
  switch(action.type) {
  case constants.UPDATE_ROUTE:
    return mergeObj(state, {
      path: action.path,
      user: action.user
    });
  case constants.UPDATE_PAGE:
    return mergeObj(state, {
      title: action.title || state.title,
      className: action.className || state.className
    });
  }

  return state;
}

module.exports = route;
