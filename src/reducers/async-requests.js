const constants = require('../constants');
const Immutable = require('immutable');
const { filter } = require('transducers.js');
const { fields } = require('../lib/redux');

const initialState = Immutable.fromJS({
  errors: [],
  openRequests: []
});

function asyncRequests(state = initialState, action) {
  console.log(action);
  if(action.type === constants.REMOVE_ERRORS) {
    return state.updateIn(
      ['errors'],
      errors => {
        // Do basically a set subtraction. For some reason converting
        // to sets and using `subtract` didn't work.
        return errors.filter(err => {
          return !action.errors.filter(err2 => err2 === err).count();
        });
      }
    );
  }
  else if(action[fields.SEQ_ID]) {
    if(action.status === "error" ) {
      state = state.updateIn(
        ['errors'],
        errors => errors.push({
          message: action.value,
          action: filter(action, x => x[0] !== 'error')
        })
      );
    }

    if(action.status === "open") {
      return state.updateIn(
        ['openRequests'],
        arr => arr.push(action[fields.SEQ_ID])
      );
    }
    else if(action.status === "error" || action.status === "close") {
      return state.updateIn(
        ['openRequests'],
        arr => arr.filter(id => id !== action[fields.SEQ_ID])
      );
    }
  }

  return state;
}

module.exports = asyncRequests;
