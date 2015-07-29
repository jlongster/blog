const constants = require('../constants');
const Immutable = require('immutable');
const { filter } = require('transducers.js');
const { fields } = require('../lib/redux');

const initialState = Immutable.fromJS([]);

function pendingRequests(state = initialState, action) {
  if(action[fields.SEQ_ID]) {
    if(action.status === "open") {
      return state.push(action[fields.SEQ_ID]);
    }
    else if(action.status === "error" || action.status === "close") {
      return state.filter(id => id !== action[fields.SEQ_ID]);
    }
  }

  return state;
}

module.exports = pendingRequests;
