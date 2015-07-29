const { slugify, mergeObj } = require('../../lib/util');
const constants = require('../constants');
const Immutable = require('immutable');

const initialState = Immutable.fromJS({
  originalUrl: null,
  error: null,
  post: {
    title: '',
    content: '',
    published: false
  }
});

function post(state = initialState, action) {
  switch(action.type) {
  case constants.UPDATE_POST_META:
    if(action.field === 'tags') {
      return state.set('post', state.get('post').set('tags', value.split(',')));
    }
    return state.set('post', state.get('post').set(action.field, action.value));
  case constants.UPDATE_POST:
    const text = action.contents;
    const match = text.match(/^\s*# ([^\n]*)\n\n/m);
    if(!match) {
      console.log('badly-formed document');
      return state;
    }

    state = state.merge({
      title: match[1],
      content: text.slice(match[0].length)
    });

    if(!state.originalUrl) {
      state = state.merge({
        shorturl: state.title ? slugify(state.title) : ''
      });
    }

    return state;
  default:
    return state;
  }
}

module.exports = post;
