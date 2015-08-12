const constants = require('../constants');
const { fields } = require('../lib/redux');
const csp = require('js-csp');
const { go, chan, take, put, Throw, operations: ops } = csp;
const api = require('impl/api');
const blogActions = require('./blog');

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

function deletePost(id) {
  return dispatch => dispatch({
    type: constants.DELETE_POST,
    id: id,
    [fields.CHANNEL]: go(function*() {
      yield api.deletePost(id);
      dispatch(blogActions.updatePath('/'));
    })
  }, { propagate: true });
}

function savePost(previousPost, post) {
  return dispatch => dispatch({
    type: constants.SAVE_POST,
    post: post,
    [fields.CHANNEL]: go(function*() {
      if(!previousPost.shorturl) {
        yield api.createPost(post.shorturl);
      }
      else if(previousPost.shorturl !== post.shorturl) {
        yield api.renamePost(previousPost.shorturl, post.shorturl);
      }

      yield api.updatePost(post.shorturl, post);

      if(previousPost.shorturl !== post.shorturl) {
        dispatch(blogActions.updatePath('/edit/' + post.shorturl));
      }
      else {
        dispatch(blogActions.updatePath('/' + post.shorturl));
      }
    }, { propagate: true })
  });
}

function removeErrors(errors) {
  return {
    type: constants.REMOVE_ERRORS,
    errors: errors
  }
}

module.exports = {
  toggleSettings,
  togglePreview,
  savePost,
  deletePost,
  removeErrors
};
