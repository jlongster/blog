const constants = require('../constants');
const Immutable = require('immutable');
const { toObj, map } = require('transducers.js');

const initialState = Immutable.fromJS({
  postsById: {},
  postsByQuery: {},
  postsByQueryName: {}
});

function posts(state = initialState, action) {
  switch(action.type) {
  case constants.FETCH_POST:
    // TODO: errors
    if(action.status === 'pump') {
      return state.updateIn(
        ['postsById'],
        p => p.set(action.value.shorturl, action.value)
      );
    }
    break;
  case constants.QUERY_POSTS:
    if(action.status === 'pump') {
      return state.updateIn(
        ['postsByQueryName'],
        p => p.set(action.query.name, action.value)
      ).updateIn(
        ['postsByQuery'],
        // Note how we are using the literal query object as a key.
        // Reference equality FTW!
        q => q.set(Immutable.fromJS(action.query), action.value)
      );
    }
    break;
  }

  return state;
}

window.Immutable = Immutable;
module.exports = posts;
