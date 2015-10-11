const Immutable = require('immutable');
const api = require('impl/api');
const actions = require('../actions/route');
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
        [fields.CHANNEL]: api.getPost(id)
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
        [fields.CHANNEL]: runQuery(query)
      });
    }
  }
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
    [fields.CHANNEL]: go(function*() {
      if(!previousPost.shorturl) {
        yield api.createPost(post.shorturl);
      }
      else if(previousPost.shorturl !== post.shorturl) {
        yield api.renamePost(previousPost.shorturl, post.shorturl);
      }

      yield api.updatePost(post.shorturl, post);

      if(previousPost.shorturl !== post.shorturl) {
        dispatch(actions.updatePath('/edit/' + post.shorturl));
      }
      else {
        dispatch(actions.updatePath('/' + post.shorturl));
      }
    }, { propagate: true })
  });
}

function deletePost(id) {
  return dispatch => dispatch({
    type: constants.DELETE_POST,
    id: id,
    [fields.CHANNEL]: go(function*() {
      yield api.deletePost(id);
      dispatch(actions.updatePath('/'));
    }, { propagate: true })
  });
}

module.exports = {
  getPost,
  queryPosts,
  queryDrafts,
  savePost,
  deletePost
};
