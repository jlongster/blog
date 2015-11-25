const Immutable = require('immutable');
const api = require('impl/api');
const { updatePath } = require('redux-simple-router');
const constants = require('../constants');
const { fields }  = require('../lib/redux');
const { go } = require('js-csp');

function getPost(id) {
  return (dispatch, getState) => {
    const state = getState();
    const posts = state.posts.get('postsById');
    const post = posts.find(post => post.shorturl === id);

    if(!post) {
      return dispatch({
        type: constants.FETCH_POST,
        id: id,
        [fields.PROMISE]: api.getPost(id)
      });
    }
    else {
      return post;
    }
  };
}

function _query(query, runQuery) {
  return (dispatch, getState) => {
    const state = getState();

    // If the query already exists in the cache, don't bother
    // re-querying it
    if(!state.posts.getIn(['postsByQuery', Immutable.fromJS(query)])) {
      return dispatch({
        type: constants.QUERY_POSTS,
        query: query,
        [fields.PROMISE]: runQuery(query)
      });
    }
  };
}

function queryPosts(query) {
  return _query(query, api.queryPosts);
}

function queryDrafts(query) {
  return _query(query, api.queryDrafts);
}

function savePost(previousPost, post) {
  return dispatch => dispatch({
    type: constants.SAVE_POST,
    post: post,
    [fields.PROMISE]: async function() {
      if(!previousPost.shorturl) {
        await api.createPost(post.shorturl);
      }
      else if(previousPost.shorturl !== post.shorturl) {
        await api.renamePost(previousPost.shorturl, post.shorturl);
      }

      await api.updatePost(post.shorturl, post);

      if(previousPost.shorturl !== post.shorturl) {
        dispatch(updatePath('/edit/' + post.shorturl));
      }
      else {
        dispatch(updatePath('/' + post.shorturl));
      }
    }
  });
}

function deletePost(id) {
  return dispatch => dispatch({
    type: constants.DELETE_POST,
    id: id,
    [fields.PROMISE]: async function() {
      await api.deletePost(id);
      dispatch(updatePath('/'));
    }
  });
}

module.exports = {
  getPost,
  queryPosts,
  queryDrafts,
  savePost,
  deletePost
};
